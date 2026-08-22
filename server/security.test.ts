import { describe, expect, it } from "vitest";
import { BODY_SIZE_LIMIT, isAllowedOrigin, isImageSignatureValid, RATE_LIMITS } from "./security";

describe("QRServe transport and upload safeguards", () => {
  it("uses bounded API payloads and purposeful rate limits", () => {
    expect(BODY_SIZE_LIMIT).toBe("8mb");
    expect(RATE_LIMITS.auth.limit).toBeLessThan(RATE_LIMITS.api.limit);
    expect(RATE_LIMITS.auth.windowMs).toBeGreaterThanOrEqual(RATE_LIMITS.api.windowMs);
  });

  it("allows only same-process, configured, or local-development origins", () => {
    expect(isAllowedOrigin()).toBe(true);
    expect(isAllowedOrigin("https://qrserve.manus.computer", "https://qrserve.manus.computer")).toBe(true);
    expect(isAllowedOrigin("https://qrserve.manus.computer", "http://qrserve.manus.computer", "qrserve.manus.computer")).toBe(true);
    expect(isAllowedOrigin("https://other-project.manus.computer", "https://qrserve.manus.computer")).toBe(false);
    expect(isAllowedOrigin("https://untrusted.example")).toBe(false);
    expect(isAllowedOrigin("not a url")).toBe(false);
  });

  it("verifies image magic bytes instead of trusting the supplied MIME type", () => {
    expect(isImageSignatureValid(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png")).toBe(true);
    expect(isImageSignatureValid(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg")).toBe(true);
    expect(isImageSignatureValid(Buffer.from("RIFFxxxxWEBPVP8 "), "image/webp")).toBe(true);
    expect(isImageSignatureValid(Buffer.from("not a real png"), "image/png")).toBe(false);
  });
});
