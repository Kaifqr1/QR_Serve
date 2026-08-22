import { describe, expect, it } from "vitest";
import { getCredentialSessionUser, hashPassword, normaliseEmail, publicUser, verifyPassword } from "./localAuth";

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
