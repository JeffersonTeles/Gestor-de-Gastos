import { describe, it, expect, beforeEach } from "vitest";
import {
  sanitizeHTML,
  escapeAttribute,
  isValidEmail,
  validatePassword,
  sanitizeNumber,
  sanitizeDate,
  sanitizeCategory,
  sanitizeDescription,
  isValidUUID,
  detectXSS,
  sanitizeInput,
  validateAndSanitizeTransaction,
  createRateLimiter,
  isValidCSRFToken,
  generateCSRFToken
} from "./security-utils.js";

describe("Security Utils", () => {
  describe("sanitizeHTML", () => {
    it("should handle null/undefined", () => {
      expect(sanitizeHTML(null)).toBe("");
      expect(sanitizeHTML(undefined)).toBe("");
    });

    it("should handle non-string input", () => {
      expect(sanitizeHTML(123)).toBe("");
    });
  });

  describe("escapeAttribute", () => {
    it("should escape dangerous characters in attributes", () => {
      const result = escapeAttribute(`" onclick="alert('XSS')"`);
      expect(result).not.toContain(`"`);
      expect(result).toContain("&quot;");
    });

    it("should escape all dangerous characters", () => {
      const input = `<>"'/`;
      const result = escapeAttribute(input);
      expect(result).not.toMatch(/[<>"'\/]/);
    });
  });

  describe("isValidEmail", () => {
    it("should accept valid emails", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("test.user+tag@domain.co.uk")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail(null)).toBe(false);
    });

    it("should reject emails exceeding max length", () => {
      const longEmail = "a".repeat(255) + "@example.com";
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should accept strong passwords", () => {
      const result = validatePassword("SecurePass123");
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should reject passwords without uppercase", () => {
      const result = validatePassword("lowercase123");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Precisa de letra maiúscula");
    });

    it("should reject passwords without numbers", () => {
      const result = validatePassword("NoNumberPass");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Precisa de número");
    });

    it("should reject passwords shorter than 8 characters", () => {
      const result = validatePassword("Sh1");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Mínimo 8 caracteres");
    });

    it("should reject null/undefined", () => {
      const resultNull = validatePassword(null);
      expect(resultNull.valid).toBe(false);

      const resultUndef = validatePassword(undefined);
      expect(resultUndef.valid).toBe(false);
    });
  });

  describe("sanitizeNumber", () => {
    it("should convert valid numbers", () => {
      expect(sanitizeNumber("123.45")).toBe(123.45);
      expect(sanitizeNumber("100")).toBe(100);
      expect(sanitizeNumber("-50.5")).toBe(-50.5);
    });

    it("should return 0 for invalid input", () => {
      expect(sanitizeNumber("abc")).toBe(0);
      expect(sanitizeNumber("")).toBe(0);
      expect(sanitizeNumber(null)).toBe(0);
    });

    it("should strip non-numeric characters", () => {
      expect(sanitizeNumber("$100.50")).toBe(100.5);
      expect(sanitizeNumber("R$ 200")).toBe(200);
    });

    it("should handle infinity and NaN", () => {
      expect(sanitizeNumber(Infinity)).toBe(0);
      expect(sanitizeNumber(NaN)).toBe(0);
    });
  });

  describe("sanitizeDate", () => {
    it("should accept valid dates", () => {
      expect(sanitizeDate("2024-03-15")).toBe("2024-03-15");
      expect(sanitizeDate("2000-01-01")).toBe("2000-01-01");
    });

    it("should reject invalid date format", () => {
      expect(sanitizeDate("15/03/2024")).toBe("");
      expect(sanitizeDate("2024-13-01")).toBe("");
      expect(sanitizeDate("2024-3-1")).toBe("");
    });

    it("should reject dates too far in future", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      const dateStr = futureDate.toISOString().split("T")[0];
      expect(sanitizeDate(dateStr)).toBe("");
    });

    it("should reject very old dates", () => {
      expect(sanitizeDate("1800-01-01")).toBe("");
    });

    it("should handle null/undefined", () => {
      expect(sanitizeDate(null)).toBe("");
      expect(sanitizeDate(undefined)).toBe("");
    });
  });

  describe("sanitizeCategory", () => {
    it("should remove dangerous characters", () => {
      const result = sanitizeCategory("Food<script>");
      expect(result).toBe("Foodscript");
      expect(result).not.toContain("<");
    });

    it("should limit length", () => {
      const long = "a".repeat(100);
      expect(sanitizeCategory(long).length).toBeLessThanOrEqual(60);
    });

    it("should trim whitespace", () => {
      expect(sanitizeCategory("  Food  ")).toBe("Food");
    });
  });

  describe("sanitizeDescription", () => {
    it("should remove dangerous characters", () => {
      const result = sanitizeDescription("Buy milk; DROP TABLE users;");
      expect(result).not.toContain("<");
      expect(result).not.toContain(";");
    });

    it("should limit length", () => {
      const long = "a".repeat(300);
      expect(sanitizeDescription(long).length).toBeLessThanOrEqual(255);
    });
  });

  describe("isValidUUID", () => {
    it("should accept valid UUIDs", () => {
      expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      expect(isValidUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    });

    it("should reject invalid UUIDs", () => {
      expect(isValidUUID("not-a-uuid")).toBe(false);
      expect(isValidUUID("550e8400e29b41d4a716446655440000")).toBe(false);
      expect(isValidUUID("")).toBe(false);
    });
  });

  describe("detectXSS", () => {
    it("should detect script tags", () => {
      expect(detectXSS("<script>alert('XSS')</script>")).toBe(true);
      expect(detectXSS("<SCRIPT>alert()</SCRIPT>")).toBe(true);
    });

    it("should detect event handlers", () => {
      expect(detectXSS('onclick="alert()"')).toBe(true);
      expect(detectXSS('onload="malicious()"')).toBe(true);
      expect(detectXSS("onerror=alert()")).toBe(true);
    });

    it("should detect javascript protocol", () => {
      expect(detectXSS("javascript:alert()")).toBe(true);
    });

    it("should not detect safe content", () => {
      expect(detectXSS("Hello World")).toBe(false);
      expect(detectXSS("Buy food at store")).toBe(false);
      expect(detectXSS("SCRIPT line in HTML")).toBe(false);
    });
  });

  describe("sanitizeInput", () => {
    it("should remove special characters", () => {
      const result = sanitizeInput("Hello<>\"World\"");
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    });

    it("should limit length", () => {
      const long = "a".repeat(300);
      expect(sanitizeInput(long).length).toBeLessThanOrEqual(255);
    });

    it("should support custom max length", () => {
      const long = "a".repeat(100);
      expect(sanitizeInput(long, 50).length).toBeLessThanOrEqual(50);
    });
  });

  describe("validateAndSanitizeTransaction", () => {
    let validTransaction;

    beforeEach(() => {
      validTransaction = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        description: "Buy groceries",
        amount: 50.5,
        date: "2024-03-15",
        type: "expense",
        category: "Food"
      };
    });

    it("should accept valid transaction", () => {
      const result = validateAndSanitizeTransaction(validTransaction);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should reject invalid UUID", () => {
      validTransaction.id = "invalid-id";
      const result = validateAndSanitizeTransaction(validTransaction);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("ID inválido");
    });

    it("should reject zero or negative amount", () => {
      validTransaction.amount = -10;
      const result = validateAndSanitizeTransaction(validTransaction);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Valor deve ser maior que zero");
    });

    it("should reject invalid date", () => {
      validTransaction.date = "invalid-date";
      const result = validateAndSanitizeTransaction(validTransaction);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Data inválida");
    });

    it("should sanitize description", () => {
      validTransaction.description = "Buy<script>alert</script> food";
      const result = validateAndSanitizeTransaction(validTransaction);
      expect(result.data.description).not.toContain("<");
    });

    it("should sanitize category", () => {
      validTransaction.category = "Food<>";
      const result = validateAndSanitizeTransaction(validTransaction);
      expect(result.data.category).not.toContain("<");
    });
  });

  describe("createRateLimiter", () => {
    it("should allow requests within limit", () => {
      const limiter = createRateLimiter(3, 60000);
      expect(limiter.check("user1")).toBe(true);
      expect(limiter.check("user1")).toBe(true);
      expect(limiter.check("user1")).toBe(true);
    });

    it("should reject requests exceeding limit", () => {
      const limiter = createRateLimiter(2, 60000);
      expect(limiter.check("user1")).toBe(true);
      expect(limiter.check("user1")).toBe(true);
      expect(limiter.check("user1")).toBe(false);
    });

    it("should rate limit per key", () => {
      const limiter = createRateLimiter(1, 60000);
      expect(limiter.check("user1")).toBe(true);
      expect(limiter.check("user2")).toBe(true);
      expect(limiter.check("user1")).toBe(false);
      expect(limiter.check("user2")).toBe(false);
    });

    it("should clear state", () => {
      const limiter = createRateLimiter(1, 60000);
      limiter.check("user1");
      limiter.clear();
      expect(limiter.check("user1")).toBe(true);
    });
  });

  describe("isValidCSRFToken", () => {
    it("should accept valid CSRF tokens", () => {
      const token = "a".repeat(32);
      expect(isValidCSRFToken(token)).toBe(true);
    });

    it("should reject short tokens", () => {
      expect(isValidCSRFToken("short")).toBe(false);
    });

    it("should reject null/undefined", () => {
      expect(isValidCSRFToken(null)).toBe(false);
      expect(isValidCSRFToken(undefined)).toBe(false);
    });

    it("should reject invalid characters", () => {
      const invalidToken = "!" + "a".repeat(31); // Contains invalid char
      expect(isValidCSRFToken(invalidToken)).toBe(false);
    });
  });

  describe("generateCSRFToken", () => {
    it("should generate valid tokens", () => {
      const token = generateCSRFToken();
      expect(isValidCSRFToken(token)).toBe(true);
    });

    it("should generate unique tokens", () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });

    it("should generate tokens of correct length", () => {
      const token = generateCSRFToken();
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });
  });
});
