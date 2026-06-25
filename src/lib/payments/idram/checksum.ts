import { createHash } from "node:crypto";

/** Verify Idram payment confirmation checksum (case-insensitive). */
export function verifyIdramChecksum(params: {
  recAccount: string;
  amount: string;
  secretKey: string;
  billNo: string;
  payerAccount: string;
  transId: string;
  transDate: string;
  receivedChecksum: string;
}): boolean {
  const payload = [
    params.recAccount,
    params.amount,
    params.secretKey,
    params.billNo,
    params.payerAccount,
    params.transId,
    params.transDate,
  ].join(":");

  const computed = createHash("md5").update(payload).digest("hex");
  return computed.toUpperCase() === params.receivedChecksum.toUpperCase();
}

/** Compare order total with Idram amount (float-safe). */
export function idramAmountMatches(orderTotal: number, edpAmount: string): boolean {
  const parsed = Number.parseFloat(edpAmount.replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return false;
  }
  return Math.abs(parsed - orderTotal) <= 0.01;
}
