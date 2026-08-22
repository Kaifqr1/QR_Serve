import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));

vi.mock("./db", () => ({
  getDb: mocks.getDb,
  getUserById: vi.fn(),
}));

import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import { ENV } from "./_core/env";

type CookieCall = { name: string; value: string; options: Record<string, unknown> };

function unauthenticatedCaller(legacyOpenId: string | null = null) {
  const cookies: CookieCall[] = [];
  const ctx: TrpcContext = {
    user: null,
    legacyOpenId,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }),
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };
  return { caller: appRouter.createCaller(ctx), cookies };
}

const existingUser = {
  id: 7,
  openId: "local-existing-user",
  name: "Restaurant Owner",
  email: "owner@example.com",
  passwordHash: null,
  loginMethod: "password",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("credential authentication router", () => {
  beforeEach(() => {
    ENV.cookieSecret = "test-session-secret-with-at-least-32-characters";
    mocks.getDb.mockReset();
  });

  it("rejects passwords shorter than twelve characters before accessing the database", async () => {
    const { caller } = unauthenticatedCaller();

    await expect(caller.auth.signIn({ email: "owner@example.com", password: "too-short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it("does not create a second account for an existing normalized email", async () => {
    const limit = vi.fn().mockResolvedValue([{ id: 7 }]);
    mocks.getDb.mockResolvedValue({
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })),
    });
    const { caller } = unauthenticatedCaller();

    await expect(caller.auth.register({ name: "Restaurant Owner", email: " OWNER@EXAMPLE.COM ", password: "a-strong-password" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("rejects a password that does not verify and does not issue a session", async () => {
    const limit = vi.fn().mockResolvedValue([{ ...existingUser, passwordHash: "$2b$12$baddataDoNotUseForARealPasswordHashxxxxxxxxxxxxxxxxxxxxxxxxxx" }]);
    mocks.getDb.mockResolvedValue({
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })),
    });
    const { caller, cookies } = unauthenticatedCaller();

    await expect(caller.auth.signIn({ email: "owner@example.com", password: "a-strong-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(cookies).toHaveLength(0);
  });

  it("requires a session for protected restaurant procedures", async () => {
    const { caller } = unauthenticatedCaller();

    await expect(caller.restaurant.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("sets an HTTPS-only, httpOnly, same-origin session cookie after registration", async () => {
    const emptyLimit = vi.fn().mockResolvedValue([]);
    const insertedLimit = vi.fn().mockResolvedValue([{ ...existingUser, passwordHash: "$2b$12$abcdefghijklmnopqrstuuJWnqTIQyNDmIyIYJZfVhP3PrFCNwJWxSXVhBJu" }]);
    const insert = vi.fn(() => ({ values: vi.fn().mockResolvedValue([{ insertId: 7 }]) }));
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: emptyLimit })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: insertedLimit })) })) });
    mocks.getDb.mockResolvedValue({ select, insert });
    const { caller, cookies } = unauthenticatedCaller();

    const user = await caller.auth.register({ name: "Restaurant Owner", email: " OWNER@EXAMPLE.COM ", password: "a-strong-password" });

    expect(user).not.toHaveProperty("passwordHash");
    expect(insert).toHaveBeenCalledWith(expect.anything());
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.name).toBe(COOKIE_NAME);
    expect(cookies[0]?.options).toMatchObject({ httpOnly: true, path: "/", sameSite: "lax", secure: true, maxAge: 14 * 24 * 60 * 60 * 1000 });
  });

  it("claims a legacy browser-verified account instead of creating a duplicate workspace", async () => {
    const noMatchingEmail = vi.fn().mockResolvedValue([]);
    const legacyAccount = { ...existingUser, openId: "legacy-owner", name: null, email: null, passwordHash: null, loginMethod: null };
    const legacyLimit = vi.fn().mockResolvedValue([legacyAccount]);
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: noMatchingEmail })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: legacyLimit })) })) });
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn(() => ({ where }));
    const update = vi.fn(() => ({ set }));
    mocks.getDb.mockResolvedValue({ select, update });
    const { caller, cookies } = unauthenticatedCaller("legacy-owner");

    const user = await caller.auth.claimLegacy({ name: "Restaurant Owner", email: "OWNER@EXAMPLE.COM", password: "a-strong-password" });

    expect(update).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ email: "owner@example.com", loginMethod: "password" }));
    expect(user).toMatchObject({ id: 7, email: "owner@example.com", name: "Restaurant Owner" });
    expect(user).not.toHaveProperty("passwordHash");
    expect(cookies).toHaveLength(1);
  });
});
