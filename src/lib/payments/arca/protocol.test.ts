import { describe, expect, it, vi } from "vitest";

import {
  getArcaOrderStatus,
  registerArcaOrder,
} from "@/lib/payments/arca/client";
import {
  ARCA_IDBANK_LIVE_URL,
  ARCA_IDBANK_TEST_URL,
  ARCA_INECO_BASE_URL,
  selectArcaCredentials,
  type ArcaCredentials,
} from "@/lib/payments/arca/credentials-select";
import {
  amdToMinorUnits,
  arcaReturnUrl,
  isArcaDepositSuccess,
  parseArcaRegisterResponse,
  parseArcaStatusResponse,
  type ArcaStatusSnapshot,
} from "@/lib/payments/arca/protocol";

const TEST_USER = "arca-test-user";
const TEST_PASSWORD = "arca-test-password";
const LIVE_USER = "arca-live-user";
const LIVE_PASSWORD = "arca-live-password";

const credentials: ArcaCredentials = {
  userName: TEST_USER,
  password: TEST_PASSWORD,
  testMode: true,
  bank: "inecobank",
  baseUrl: ARCA_INECO_BASE_URL,
};

function depositedStatus(
  overrides: Partial<ArcaStatusSnapshot> = {},
): ArcaStatusSnapshot {
  return {
    errorCode: 0,
    orderNumber: "p123",
    orderStatus: 2,
    paymentState: "DEPOSITED",
    depositedAmount: 190000,
    approvedAmount: 190000,
    ...overrides,
  };
}

describe("amdToMinorUnits", () => {
  it("converts integer AMD to Arca minor units", () => {
    expect(amdToMinorUnits(1900)).toBe(190000);
    expect(amdToMinorUnits(1000)).toBe(100000);
    expect(amdToMinorUnits(0)).toBe(0);
  });
});

describe("selectArcaCredentials", () => {
  it("uses test keys when ARCA_TEST_MODE is true, else live keys", () => {
    expect(
      selectArcaCredentials({
        ARCA_TEST_MODE: "true",
        ARCA_BANK: "inecobank",
        ARCA_USERNAME: TEST_USER,
        ARCA_PASSWORD: TEST_PASSWORD,
        ARCA_LIVE_USERNAME: LIVE_USER,
        ARCA_LIVE_PASSWORD: LIVE_PASSWORD,
      }),
    ).toEqual({
      userName: TEST_USER,
      password: TEST_PASSWORD,
      testMode: true,
      bank: "inecobank",
      baseUrl: ARCA_INECO_BASE_URL,
    });

    expect(
      selectArcaCredentials({
        ARCA_TEST_MODE: "false",
        ARCA_BANK: "inecobank",
        ARCA_USERNAME: TEST_USER,
        ARCA_PASSWORD: TEST_PASSWORD,
        ARCA_LIVE_USERNAME: LIVE_USER,
        ARCA_LIVE_PASSWORD: LIVE_PASSWORD,
      }),
    ).toMatchObject({
      userName: LIVE_USER,
      password: LIVE_PASSWORD,
      testMode: false,
      baseUrl: ARCA_INECO_BASE_URL,
    });

    expect(
      selectArcaCredentials({
        ARCA_TEST_MODE: "true",
        ARCA_USERNAME: "",
        ARCA_PASSWORD: "",
      }),
    ).toBeNull();
  });

  it("uses IDBank test vs live hosts; Ineco stays on one host", () => {
    expect(
      selectArcaCredentials({
        ARCA_TEST_MODE: "true",
        ARCA_BANK: "idbank",
        ARCA_USERNAME: TEST_USER,
        ARCA_PASSWORD: TEST_PASSWORD,
      })?.baseUrl,
    ).toBe(ARCA_IDBANK_TEST_URL);
    expect(
      selectArcaCredentials({
        ARCA_TEST_MODE: "false",
        ARCA_BANK: "idbank",
        ARCA_LIVE_USERNAME: LIVE_USER,
        ARCA_LIVE_PASSWORD: LIVE_PASSWORD,
      })?.baseUrl,
    ).toBe(ARCA_IDBANK_LIVE_URL);
  });
});

describe("isArcaDepositSuccess", () => {
  it("accepts DEPOSITED / orderStatus 2 with matching depositedAmount", () => {
    expect(isArcaDepositSuccess(depositedStatus(), 190000)).toBe(true);
    expect(
      isArcaDepositSuccess(
        depositedStatus({ paymentState: "deposited", orderStatus: undefined }),
        190000,
      ),
    ).toBe(true);
    expect(
      isArcaDepositSuccess(
        depositedStatus({ paymentState: undefined, orderStatus: 2 }),
        190000,
      ),
    ).toBe(true);
  });

  it("rejects orderStatus 5 REFUNDED even with depositedAmount", () => {
    expect(
      isArcaDepositSuccess(
        depositedStatus({ orderStatus: 5, paymentState: "REFUNDED" }),
        190000,
      ),
    ).toBe(false);
    expect(
      isArcaDepositSuccess(
        depositedStatus({ orderStatus: 5, paymentState: "DEPOSITED" }),
        190000,
      ),
    ).toBe(false);
  });

  it("rejects amount mismatch and zero deposit", () => {
    expect(
      isArcaDepositSuccess(depositedStatus({ depositedAmount: 1900 }), 190000),
    ).toBe(false);
    expect(
      isArcaDepositSuccess(depositedStatus({ depositedAmount: 0 }), 190000),
    ).toBe(false);
  });
});

describe("parseArca responses", () => {
  it("accepts register errorCode 0 with https formUrl", () => {
    expect(
      parseArcaRegisterResponse({
        errorCode: "0",
        orderId: "bank-uuid",
        formUrl: "https://pg.inecoecom.am/payment/merchants/pay",
      }),
    ).toEqual({
      ok: true,
      orderId: "bank-uuid",
      formUrl: "https://pg.inecoecom.am/payment/merchants/pay",
    });
    expect(parseArcaRegisterResponse({ errorCode: 1 })).toMatchObject({
      ok: false,
      errorCode: 1,
    });
  });

  it("reads nested paymentAmountInfo", () => {
    expect(
      parseArcaStatusResponse({
        errorCode: 0,
        orderStatus: 2,
        paymentAmountInfo: {
          paymentState: "DEPOSITED",
          depositedAmount: 190000,
        },
      }),
    ).toMatchObject({
      errorCode: 0,
      orderStatus: 2,
      paymentState: "DEPOSITED",
      depositedAmount: 190000,
    });
  });
});

describe("arcaReturnUrl", () => {
  it("keeps the old /inecobank/result path with our order number", () => {
    expect(arcaReturnUrl("http://192.168.15.204:3000/", "p123")).toBe(
      "http://192.168.15.204:3000/inecobank/result?order=p123",
    );
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("Arca client (mocked fetch)", () => {
  it("POSTs register.do as form-urlencoded with minor-unit amount", async () => {
    const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe(`${ARCA_INECO_BASE_URL}/register.do`);
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual({
        "content-type": "application/x-www-form-urlencoded",
      });
      const body = String(init.body);
      expect(body).toContain("amount=190000");
      expect(body).toContain("currency=051");
      expect(body).toContain("orderNumber=p123");
      expect(body).toContain("jsonParams=");
      expect(body).toContain(encodeURIComponent('{"FORCE_3DS2":"true"}'));
      expect(body).toContain("userName=arca-test-user");
      return jsonResponse({
        errorCode: 0,
        orderId: "bank-uuid",
        formUrl: "https://pg.inecoecom.am/payment/merchants/pay",
      });
    });

    const result = await registerArcaOrder(
      credentials,
      {
        orderNumber: "p123",
        totalAmount: 1900,
        locale: "hy",
        appUrl: "http://192.168.15.204:3000",
      },
      fetchImpl,
    );
    expect(result).toEqual({
      ok: true,
      orderId: "bank-uuid",
      formUrl: "https://pg.inecoecom.am/payment/merchants/pay",
    });
  });

  it("POSTs getOrderStatusExtended.do with the persisted bank orderId", async () => {
    const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe(`${ARCA_INECO_BASE_URL}/getOrderStatusExtended.do`);
      const body = String(init.body);
      expect(body).toContain("orderId=bank-uuid");
      return jsonResponse({
        errorCode: 0,
        orderStatus: 2,
        paymentAmountInfo: {
          paymentState: "DEPOSITED",
          depositedAmount: 190000,
        },
      });
    });
    const status = await getArcaOrderStatus(
      credentials,
      "bank-uuid",
      fetchImpl,
    );
    expect(status && isArcaDepositSuccess(status, 190000)).toBe(true);
  });
});
