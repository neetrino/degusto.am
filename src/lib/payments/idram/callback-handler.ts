import { loadPendingPaymentOrder } from "@/lib/payments/load-pending-order";
import {
  markOrderPaymentFailed,
  markOrderPaymentPaid,
} from "@/lib/payments/mark-order-payment";
import { IDRAM_OK_RESPONSE } from "./constants";
import { getIdramConfig } from "./config";
import { idramAmountMatches, verifyIdramChecksum } from "./checksum";
import { createIdramInitPayload } from "./form";
import type { IdramCallbackFields, IdramInitResult } from "./types";
import { logger } from "@/lib/utils/logger";

export type IdramInitInput = {
  orderNumber: string;
  lang?: string;
};

/** Build Idram form payload for checkout redirect. */
export async function initiateIdramPayment(input: IdramInitInput): Promise<IdramInitResult> {
  const order = await loadPendingPaymentOrder(input.orderNumber, "idram");
  if (!order) {
    throw new Error("Order not found");
  }
  if (order.currency !== "AMD") {
    throw new Error("Idram supports AMD orders only");
  }
  if (order.paymentStatus !== "pending" || order.payment.status !== "pending") {
    throw new Error("Order is not pending payment");
  }

  const config = getIdramConfig();
  return createIdramInitPayload({
    orderNumber: order.number,
    amount: order.total,
    description: `Order ${order.number}`,
    recAccount: config.recAccount,
    email: order.customerEmail,
    locale: order.customerLocale,
    lang: input.lang,
  });
}

function readFormFields(formData: FormData): IdramCallbackFields {
  const read = (key: string): string | undefined => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };

  return {
    EDP_PRECHECK: read("EDP_PRECHECK"),
    EDP_BILL_NO: read("EDP_BILL_NO"),
    EDP_REC_ACCOUNT: read("EDP_REC_ACCOUNT"),
    EDP_AMOUNT: read("EDP_AMOUNT"),
    EDP_PAYER_ACCOUNT: read("EDP_PAYER_ACCOUNT"),
    EDP_TRANS_ID: read("EDP_TRANS_ID"),
    EDP_TRANS_DATE: read("EDP_TRANS_DATE"),
    EDP_CHECKSUM: read("EDP_CHECKSUM"),
  };
}

async function handleIdramPrecheck(fields: IdramCallbackFields): Promise<string> {
  const config = getIdramConfig();
  const billNo = fields.EDP_BILL_NO?.trim();
  const amount = fields.EDP_AMOUNT?.trim();

  if (!billNo || !amount) {
    return "EDP_BILL_NO or EDP_AMOUNT missing";
  }
  if (fields.EDP_REC_ACCOUNT !== config.recAccount) {
    return "EDP_REC_ACCOUNT mismatch";
  }

  const order = await loadPendingPaymentOrder(billNo, "idram");
  if (!order) {
    return "EDP_BILL_NO not found";
  }
  if (order.paymentStatus !== "pending") {
    return "Order is not pending";
  }
  if (!idramAmountMatches(order.total, amount)) {
    return "EDP_AMOUNT mismatch";
  }

  return IDRAM_OK_RESPONSE;
}

async function handleIdramConfirmation(fields: IdramCallbackFields): Promise<string> {
  const config = getIdramConfig();
  const billNo = fields.EDP_BILL_NO?.trim();
  const amount = fields.EDP_AMOUNT?.trim();
  const transId = fields.EDP_TRANS_ID?.trim();
  const checksum = fields.EDP_CHECKSUM?.trim() ?? "";

  if (!billNo || !amount || !transId) {
    return "Missing required Idram fields";
  }

  const order = await loadPendingPaymentOrder(billNo, "idram");
  if (!order) {
    return "EDP_BILL_NO not found";
  }

  if (order.paymentStatus === "paid") {
    return IDRAM_OK_RESPONSE;
  }

  if (fields.EDP_REC_ACCOUNT !== config.recAccount) {
    return "EDP_REC_ACCOUNT mismatch";
  }
  if (!idramAmountMatches(order.total, amount)) {
    return "EDP_AMOUNT mismatch";
  }

  const payerAccount = fields.EDP_PAYER_ACCOUNT?.trim() ?? "";
  const transDate = fields.EDP_TRANS_DATE?.trim() ?? "";

  const checksumValid = verifyIdramChecksum({
    recAccount: config.recAccount,
    amount,
    secretKey: config.secretKey,
    billNo,
    payerAccount,
    transId,
    transDate,
    receivedChecksum: checksum,
  });

  if (!checksumValid) {
    return "EDP_CHECKSUM not correct";
  }

  await markOrderPaymentPaid({
    orderId: order.id,
    paymentId: order.payment.id,
    providerTransactionId: transId,
    providerResponse: fields as object,
  });

  return IDRAM_OK_RESPONSE;
}

/** Handle Idram RESULT_URL POST (precheck or payment confirmation). */
export async function handleIdramCallback(formData: FormData): Promise<string> {
  const fields = readFormFields(formData);

  try {
    if (fields.EDP_PRECHECK === "YES") {
      return await handleIdramPrecheck(fields);
    }
    return await handleIdramConfirmation(fields);
  } catch (error) {
    logger.error("Idram callback error", { error, billNo: fields.EDP_BILL_NO });
    await maybeMarkFailed(fields.EDP_BILL_NO);
    return "Internal error";
  }
}

async function maybeMarkFailed(billNo: string | undefined): Promise<void> {
  if (!billNo) {
    return;
  }
  const order = await loadPendingPaymentOrder(billNo, "idram");
  if (!order || order.paymentStatus === "paid") {
    return;
  }
  await markOrderPaymentFailed({
    orderId: order.id,
    paymentId: order.payment.id,
    errorMessage: "Idram callback processing failed",
  });
}
