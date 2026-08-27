import { describe, expect, it } from "vitest";

import {
  evaluateIdramConfirm,
  evaluateIdramPrecheck,
  readIdramCallbackFields,
  type IdramCallbackFields,
  type IdramOrderSnapshot,
} from "@/lib/payments/idram/callback";
import { selectIdramCredentials } from "@/lib/payments/idram/credentials-select";
import {
  IDRAM_FAIL,
  IDRAM_GET_PAYMENT_URL,
  IDRAM_OK,
  buildIdramFormFields,
  computeIdramChecksum,
  formatIdramAmount,
  idramAmountsMatch,
  idramChecksumMatches,
  idramFormData,
  idramLanguage,
} from "@/lib/payments/idram/protocol";

const TEST_ACCOUNT = "100000114";
const TEST_SECRET = "test-idram-secret";

const pendingOrder: IdramOrderSnapshot = {
  orderNumber: "p123",
  totalAmount: 1900,
  paymentStatus: "PENDING",
  paymentProvider: "idram",
};

function precheckFields(
  overrides: Partial<IdramCallbackFields> = {},
): IdramCallbackFields {
  return {
    precheck: "YES",
    recAccount: TEST_ACCOUNT,
    amount: "1900.00",
    billNo: "p123",
    payerAccount: undefined,
    transId: undefined,
    transDate: undefined,
    checksum: undefined,
    ...overrides,
  };
}

function confirmFields(
  overrides: Partial<IdramCallbackFields> = {},
): IdramCallbackFields {
  const amount = overrides.amount ?? "1900.00";
  const billNo = overrides.billNo ?? "p123";
  const recAccount = overrides.recAccount ?? TEST_ACCOUNT;
  const payerAccount = overrides.payerAccount ?? "payer-wallet";
  const transId = overrides.transId ?? "tx-1001";
  const transDate = overrides.transDate ?? "2026-08-27 12:00:00";
  const checksum =
    overrides.checksum ??
    computeIdramChecksum({
      recAccount,
      amount,
      secretKey: TEST_SECRET,
      billNo,
      payerAccount,
      transId,
      transDate,
    });
  return {
    precheck: undefined,
    recAccount,
    amount,
    billNo,
    payerAccount,
    transId,
    transDate,
    checksum,
    ...overrides,
  };
}

describe("Idram protocol", () => {
  it("formats integer AMD as a dotted decimal and compares the same way", () => {
    expect(formatIdramAmount(1900)).toBe("1900.00");
    expect(idramAmountsMatch(1900, "1900")).toBe(true);
    expect(idramAmountsMatch(1900, "1900.00")).toBe(true);
    expect(idramAmountsMatch(1900, "1900.01")).toBe(false);
    expect(idramAmountsMatch(1900, "1899")).toBe(false);
  });

  it("maps locales and builds GetPayment fields without the secret", () => {
    expect(idramLanguage("hy")).toBe("AM");
    expect(idramLanguage("en")).toBe("EN");
    expect(idramLanguage("ru")).toBe("RU");
    const data = idramFormData(
      buildIdramFormFields({
        recAccount: TEST_ACCOUNT,
        locale: "hy",
        orderNumber: "p123",
        totalAmount: 1900,
        contactEmail: "buyer@example.com",
      }),
    );
    expect(data.EDP_BILL_NO).toBe("p123");
    expect(data.EDP_AMOUNT).toBe("1900.00");
    expect(data.EDP_LANGUAGE).toBe("AM");
    expect(data.EDP_EMAIL).toBe("buyer@example.com");
    expect(JSON.stringify(data)).not.toContain(TEST_SECRET);
    expect(IDRAM_GET_PAYMENT_URL).toContain("banking.idram.am");
  });

  it("matches checksums case-insensitively", () => {
    const input = {
      recAccount: TEST_ACCOUNT,
      amount: "1900.00",
      secretKey: TEST_SECRET,
      billNo: "p123",
      payerAccount: "payer-wallet",
      transId: "tx-1001",
      transDate: "2026-08-27 12:00:00",
    };
    const hex = computeIdramChecksum(input);
    expect(idramChecksumMatches(input, hex.toLowerCase())).toBe(true);
    expect(idramChecksumMatches(input, hex.toUpperCase())).toBe(true);
    expect(idramChecksumMatches(input, "0".repeat(32))).toBe(false);
  });
});

describe("Idram precheck", () => {
  it("accepts a pending Idram order with matching account and amount", () => {
    const result = evaluateIdramPrecheck({
      fields: precheckFields(),
      expectedAccount: TEST_ACCOUNT,
      order: pendingOrder,
    });
    expect(result).toEqual({ ok: true, alreadyCaptured: false });
  });

  it("rejects missing order, wrong account, amount mismatch, and non-pending", () => {
    expect(
      evaluateIdramPrecheck({
        fields: precheckFields({ billNo: undefined }),
        expectedAccount: TEST_ACCOUNT,
        order: null,
      }).ok,
    ).toBe(false);

    expect(
      evaluateIdramPrecheck({
        fields: precheckFields(),
        expectedAccount: TEST_ACCOUNT,
        order: null,
      }),
    ).toEqual({ ok: false, token: IDRAM_FAIL.ORDER });

    expect(
      evaluateIdramPrecheck({
        fields: precheckFields({ recAccount: "other" }),
        expectedAccount: TEST_ACCOUNT,
        order: pendingOrder,
      }),
    ).toEqual({ ok: false, token: IDRAM_FAIL.ACCOUNT });

    expect(
      evaluateIdramPrecheck({
        fields: precheckFields({ amount: "10.00" }),
        expectedAccount: TEST_ACCOUNT,
        order: pendingOrder,
      }),
    ).toEqual({ ok: false, token: IDRAM_FAIL.AMOUNT });

    expect(
      evaluateIdramPrecheck({
        fields: precheckFields(),
        expectedAccount: TEST_ACCOUNT,
        order: { ...pendingOrder, paymentStatus: "CAPTURED" },
      }),
    ).toEqual({ ok: false, token: IDRAM_FAIL.STATUS });
  });
});

describe("Idram confirm", () => {
  it("accepts a valid checksum and is idempotent when already captured", () => {
    expect(
      evaluateIdramConfirm({
        fields: confirmFields(),
        expectedAccount: TEST_ACCOUNT,
        secretKey: TEST_SECRET,
        order: pendingOrder,
      }),
    ).toEqual({ ok: true, alreadyCaptured: false });

    expect(
      evaluateIdramConfirm({
        fields: confirmFields(),
        expectedAccount: TEST_ACCOUNT,
        secretKey: TEST_SECRET,
        order: { ...pendingOrder, paymentStatus: "CAPTURED" },
      }),
    ).toEqual({ ok: true, alreadyCaptured: true });
  });

  it("rejects amount mismatch and bad checksum", () => {
    expect(
      evaluateIdramConfirm({
        fields: confirmFields({ amount: "10.00" }),
        expectedAccount: TEST_ACCOUNT,
        secretKey: TEST_SECRET,
        order: pendingOrder,
      }),
    ).toEqual({ ok: false, token: IDRAM_FAIL.AMOUNT });

    expect(
      evaluateIdramConfirm({
        fields: confirmFields({ checksum: "a".repeat(32) }),
        expectedAccount: TEST_ACCOUNT,
        secretKey: TEST_SECRET,
        order: pendingOrder,
      }),
    ).toEqual({ ok: false, token: IDRAM_FAIL.CHECKSUM });
  });

  it("reads bill number aliases from a raw form map", () => {
    const fields = readIdramCallbackFields({
      order_number: "p200",
      EDP_AMOUNT: "1.00",
    });
    expect(fields.billNo).toBe("p200");
    expect(IDRAM_OK).toBe("OK");
  });
});

describe("selectIdramCredentials", () => {
  it("uses test keys when IDRAM_TEST_MODE is true, else live keys", () => {
    expect(
      selectIdramCredentials({
        IDRAM_TEST_MODE: "true",
        IDRAM_REC_ACCOUNT: "test-acc",
        IDRAM_SECRET_KEY: "test-secret",
        IDRAM_LIVE_REC_ACCOUNT: "live-acc",
        IDRAM_LIVE_SECRET_KEY: "live-secret",
      }),
    ).toEqual({
      recAccount: "test-acc",
      secretKey: "test-secret",
      testMode: true,
    });

    expect(
      selectIdramCredentials({
        IDRAM_TEST_MODE: "false",
        IDRAM_REC_ACCOUNT: "test-acc",
        IDRAM_SECRET_KEY: "test-secret",
        IDRAM_LIVE_REC_ACCOUNT: "live-acc",
        IDRAM_LIVE_SECRET_KEY: "live-secret",
      }),
    ).toMatchObject({ recAccount: "live-acc", testMode: false });

    expect(
      selectIdramCredentials({
        IDRAM_TEST_MODE: "true",
        IDRAM_REC_ACCOUNT: "",
        IDRAM_SECRET_KEY: "",
      }),
    ).toBeNull();
  });
});
