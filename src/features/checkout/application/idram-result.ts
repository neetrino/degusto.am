import { logger } from "@/lib/observability/logger";
import {
  evaluateIdramConfirm,
  evaluateIdramPrecheck,
  isIdramConfirm,
  isIdramPrecheck,
  idramResultToken,
  readIdramCallbackFields,
} from "@/lib/payments/idram/callback";
import {
  getIdramCredentials,
  type IdramCredentials,
} from "@/lib/payments/idram/credentials";
import { IDRAM_FAIL, IDRAM_OK } from "@/lib/payments/idram/protocol";
import {
  captureIdramOrder,
  loadIdramOrderSnapshot,
} from "@/features/checkout/application/idram-order";

function logResult(orderNumber: string | undefined, token: string): void {
  if (token === IDRAM_OK) {
    logger.info("Idram RESULT accepted", { orderNumber: orderNumber ?? "" });
    return;
  }
  logger.warn("Idram RESULT rejected", {
    orderNumber: orderNumber ?? "",
    token,
  });
}

async function handleConfirm(
  fields: ReturnType<typeof readIdramCallbackFields>,
  recAccount: string,
  secretKey: string,
  order: Awaited<ReturnType<typeof loadIdramOrderSnapshot>>,
): Promise<string> {
  const evaluated = evaluateIdramConfirm({
    fields,
    expectedAccount: recAccount,
    secretKey,
    order,
  });
  if (!evaluated.ok) {
    return evaluated.token;
  }
  if (evaluated.alreadyCaptured) {
    return IDRAM_OK;
  }
  if (!fields.billNo || !fields.transId) {
    return IDRAM_FAIL.GENERIC;
  }
  try {
    const capture = await captureIdramOrder(fields.billNo, fields.transId);
    if (capture === "missing") {
      return IDRAM_FAIL.ORDER;
    }
    return IDRAM_OK;
  } catch {
    logger.error("Idram capture failed", { orderNumber: fields.billNo });
    return IDRAM_FAIL.GENERIC;
  }
}

/** RESULT_URL: precheck then confirm. Plain-text token only. */
export async function handleIdramResult(
  raw: Record<string, string>,
): Promise<string> {
  const fields = readIdramCallbackFields(raw);
  try {
    const credentials = getIdramCredentials();
    if (!credentials) {
      logResult(fields.billNo, IDRAM_FAIL.GENERIC);
      return IDRAM_FAIL.GENERIC;
    }
    const order = fields.billNo
      ? await loadIdramOrderSnapshot(fields.billNo)
      : null;
    const token = await resolveIdramToken(fields, credentials, order);
    logResult(fields.billNo, token);
    return token;
  } catch {
    logger.error("Idram RESULT handler failed", {
      orderNumber: fields.billNo ?? "",
    });
    return IDRAM_FAIL.GENERIC;
  }
}

async function resolveIdramToken(
  fields: ReturnType<typeof readIdramCallbackFields>,
  credentials: IdramCredentials,
  order: Awaited<ReturnType<typeof loadIdramOrderSnapshot>>,
): Promise<string> {
  if (isIdramPrecheck(fields)) {
    return idramResultToken(
      evaluateIdramPrecheck({
        fields,
        expectedAccount: credentials.recAccount,
        order,
      }),
    );
  }
  if (isIdramConfirm(fields)) {
    return handleConfirm(
      fields,
      credentials.recAccount,
      credentials.secretKey,
      order,
    );
  }
  return fields.billNo ? IDRAM_FAIL.GENERIC : IDRAM_FAIL.NO_BILL;
}
