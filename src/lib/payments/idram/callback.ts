import {
  IDRAM_FAIL,
  IDRAM_OK,
  idramAmountsMatch,
  idramChecksumMatches,
  type IdramFailToken,
} from "@/lib/payments/idram/protocol";

export type IdramCallbackFields = {
  precheck: string | undefined;
  recAccount: string | undefined;
  amount: string | undefined;
  billNo: string | undefined;
  payerAccount: string | undefined;
  transId: string | undefined;
  transDate: string | undefined;
  checksum: string | undefined;
};

export type IdramOrderSnapshot = {
  orderNumber: string;
  totalAmount: number;
  paymentStatus: string;
  paymentProvider: string;
};

export type IdramEvaluateOk = {
  ok: true;
  alreadyCaptured: boolean;
};

export type IdramEvaluateFail = {
  ok: false;
  token: IdramFailToken;
};

export type IdramEvaluateResult = IdramEvaluateOk | IdramEvaluateFail;

function firstString(
  raw: Record<string, string>,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = raw[key]?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}

/** Reads Idram callback fields from a form or query map. */
export function readIdramCallbackFields(
  raw: Record<string, string>,
): IdramCallbackFields {
  return {
    precheck: firstString(raw, ["EDP_PRECHECK"]),
    recAccount: firstString(raw, ["EDP_REC_ACCOUNT"]),
    amount: firstString(raw, ["EDP_AMOUNT"]),
    billNo: firstString(raw, ["EDP_BILL_NO", "order_number", "BILL_NO"]),
    payerAccount: firstString(raw, ["EDP_PAYER_ACCOUNT"]),
    transId: firstString(raw, ["EDP_TRANS_ID"]),
    transDate: firstString(raw, ["EDP_TRANS_DATE"]),
    checksum: firstString(raw, ["EDP_CHECKSUM"]),
  };
}

export function isIdramPrecheck(fields: IdramCallbackFields): boolean {
  return fields.precheck === "YES";
}

export function isIdramConfirm(fields: IdramCallbackFields): boolean {
  return Boolean(
    fields.payerAccount &&
      fields.amount &&
      fields.transId &&
      fields.checksum &&
      fields.transDate,
  );
}

function fail(token: IdramFailToken): IdramEvaluateFail {
  return { ok: false, token };
}

function missingBillOrOrder(
  billNo: string | undefined,
  order: IdramOrderSnapshot | null,
): IdramEvaluateFail | null {
  if (!billNo) {
    return fail(IDRAM_FAIL.NO_BILL);
  }
  if (!order) {
    return fail(IDRAM_FAIL.ORDER);
  }
  return null;
}

function requireAccountAndAmount(
  recAccount: string | undefined,
  amount: string | undefined,
  expectedAccount: string,
  order: IdramOrderSnapshot,
): IdramEvaluateFail | null {
  if (recAccount !== expectedAccount) {
    return fail(IDRAM_FAIL.ACCOUNT);
  }
  if (!amount || !idramAmountsMatch(order.totalAmount, amount)) {
    return fail(IDRAM_FAIL.AMOUNT);
  }
  return null;
}

/** Precheck: account, pending Idram payment, amount vs DB total. */
export function evaluateIdramPrecheck(input: {
  fields: IdramCallbackFields;
  expectedAccount: string;
  order: IdramOrderSnapshot | null;
}): IdramEvaluateResult {
  const billFail = missingBillOrOrder(input.fields.billNo, input.order);
  if (billFail || !input.order) {
    return billFail ?? fail(IDRAM_FAIL.ORDER);
  }
  const order = input.order;
  if (order.paymentProvider !== "idram") {
    return fail(IDRAM_FAIL.STATUS);
  }
  const moneyFail = requireAccountAndAmount(
    input.fields.recAccount,
    input.fields.amount,
    input.expectedAccount,
    order,
  );
  if (moneyFail) {
    return moneyFail;
  }
  if (order.paymentStatus !== "PENDING") {
    return fail(IDRAM_FAIL.STATUS);
  }
  return { ok: true, alreadyCaptured: false };
}

/** Confirm: checksum + amount; CAPTURED orders stay OK when checksum matches. */
export function evaluateIdramConfirm(input: {
  fields: IdramCallbackFields;
  expectedAccount: string;
  secretKey: string;
  order: IdramOrderSnapshot | null;
}): IdramEvaluateResult {
  const { fields } = input;
  const billFail = missingBillOrOrder(fields.billNo, input.order);
  if (billFail || !input.order) {
    return billFail ?? fail(IDRAM_FAIL.ORDER);
  }
  if (
    !fields.recAccount ||
    !fields.amount ||
    !fields.payerAccount ||
    !fields.transId ||
    !fields.transDate ||
    !fields.checksum ||
    !fields.billNo
  ) {
    return fail(IDRAM_FAIL.GENERIC);
  }
  const order = input.order;
  if (order.paymentProvider !== "idram") {
    return fail(IDRAM_FAIL.STATUS);
  }
  const moneyFail = requireAccountAndAmount(
    fields.recAccount,
    fields.amount,
    input.expectedAccount,
    order,
  );
  if (moneyFail) {
    return moneyFail;
  }
  const checksumOk = idramChecksumMatches(
    {
      recAccount: fields.recAccount,
      amount: fields.amount,
      secretKey: input.secretKey,
      billNo: fields.billNo,
      payerAccount: fields.payerAccount,
      transId: fields.transId,
      transDate: fields.transDate,
    },
    fields.checksum,
  );
  if (!checksumOk) {
    return fail(IDRAM_FAIL.CHECKSUM);
  }
  if (order.paymentStatus === "CAPTURED") {
    return { ok: true, alreadyCaptured: true };
  }
  if (order.paymentStatus !== "PENDING") {
    return fail(IDRAM_FAIL.STATUS);
  }
  return { ok: true, alreadyCaptured: false };
}

export function idramResultToken(result: IdramEvaluateResult): string {
  return result.ok ? IDRAM_OK : result.token;
}
