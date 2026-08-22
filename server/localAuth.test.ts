import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { COOKIE_NAME } from "../shared/const";
import { ENV } from "./_core/env";
import { createCredentialSession, getCredentialSessionUser, getLegacySessionOpenId, hashPassword, normaliseEmail, publicUser, verifyPassword } from "./localAuth";

describe("local credential authentication", () => {
  it("normalises email addresses before identity lookup", () => {
    expect(normaliseEmail("  OWNER@Example.COM ")).toBe("owner@example.com");
  });

  it("hashes passwords and rejects an incorrect password", async () => {
    const hashed = await hashPassword("a-secure-password");
    expect(hashed).not.toContain("a-secure-password");
    await expect(verifyPassword("a-secure-password", hashed)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hashed)).resolves.toBe(false);
  });

  it("returns no account when the credential cookie is absent", async () => {
    await expect(getCredentialSessionUser({ headers: {} })).resolves.toBeNull();
  });

  it("accepts only a signed legacy browser session with a complete legacy identity", async () => {
    ENV.cookieSecret = "test-session-secret-with-at-least-32-characters";
    const token = await new SignJWT({ openId: "legacy-owner", appId: "old-app" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(ENV.cookieSecret));

    await expect(getLegacySessionOpenId({ headers: { cookie: `${COOKIE_NAME}=${token}` } })).resolves.toBe("legacy-owner");
    await expect(getLegacySessionOpenId({ headers: { cookie: `${COOKIE_NAME}=not-a-token` } })).resolves.toBeNull();
  });

  it("uses a development-only session key when no secret is configured and rejects that configuration in production", async () => {
    const originalSecret = ENV.cookieSecret;
    const originalProduction = ENV.isProduction;
    ENV.cookieSecret = "";
    ENV.isProduction = false;
    await expect(createCredentialSession(4)).resolves.toEqual(expect.any(String));
    ENV.isProduction = true;
    await expect(createCredentialSession(4)).rejects.toThrow("JWT_SECRET must be at least 32 characters in production.");
    ENV.cookieSecret = originalSecret;
    ENV.isProduction = originalProduction;
  });

  it("never returns a password hash in the public user response", () => {
    const user = publicUser({
      id: 4,
      openId: "local-user",
      name: "Restaurant Owner",
      email: "owner@example.com",
      passwordHash: "never-return-this",
      loginMethod: "password",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    expect(user).not.toHaveProperty("passwordHash");
    expect(user.email).toBe("owner@example.com");
  });
});
