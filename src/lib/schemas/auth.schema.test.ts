import { describe, it, expect } from "vitest";
import {
  parseLoginBody,
  parseRegisterBody,
  safeParseLogin,
  safeParseRegister,
} from "./auth.schema";

describe("auth.schema", () => {
  describe("login", () => {
    it("parses valid login with email", () => {
      const body = { identifier: "u@x.com", password: "secret" };
      expect(parseLoginBody(body)).toEqual(body);
      expect(safeParseLogin(body).success).toBe(true);
    });

    it("parses valid login with phone", () => {
      const body = { identifier: "+37499111222", password: "secret" };
      expect(parseLoginBody(body)).toEqual(body);
      expect(safeParseLogin(body).success).toBe(true);
    });

    it("accepts legacy email field for compatibility", () => {
      const body = { email: "u@x.com", password: "secret" };
      expect(parseLoginBody(body)).toEqual({
        identifier: "u@x.com",
        password: "secret",
      });
    });

    it("rejects missing identifier", () => {
      const body = { password: "secret" };
      expect(() => parseLoginBody(body)).toThrow();
      const result = safeParseLogin(body);
      expect(result.success).toBe(false);
    });

    it("rejects missing password", () => {
      const body = { identifier: "u@x.com" };
      expect(() => parseLoginBody(body)).toThrow();
    });
  });

  describe("register", () => {
    const validPassword = "12345678";

    it("parses valid register with email", () => {
      const body = {
        email: "u@x.com",
        password: validPassword,
        firstName: "A",
        lastName: "B",
      };
      expect(parseRegisterBody(body)).toEqual(body);
      expect(safeParseRegister(body).success).toBe(true);
    });

    it("parses valid register with phone", () => {
      const body = { phone: "+123", password: validPassword };
      expect(parseRegisterBody(body)).toEqual(body);
    });

    it("rejects password shorter than 8", () => {
      const body = { email: "u@x.com", password: "1234567" };
      expect(() => parseRegisterBody(body)).toThrow();
      expect(safeParseRegister(body).success).toBe(false);
    });

    it("rejects when neither email nor phone", () => {
      const body = { password: validPassword };
      expect(() => parseRegisterBody(body)).toThrow();
    });
  });
});
