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
import { hashPassword } from "./localAuth";

type CookieCall = { name: string; value: string; options: Record<string, unknown> };

function unauthenticatedCaller() {
  const cookies: CookieCall[] = [];
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }),
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };
  return { caller: appRouter.createCaller(ctx), cookies };
}

const administrator = {
  id: 1,
  openId: "legacy-admin",
  name: "Kaif",
  email: "admin@kaif.com",
  passwordHash: null,
  loginMethod: "password",
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("administrator-only authentication router", () => {
  beforeEach(() => {
    ENV.cookieSecret = "test-session-secret-with-at-least-32-characters";
    mocks.getDb.mockReset();
  });

  it("does not expose self-service registration or legacy-claim procedures", () => {
    const procedures = (appRouter as unknown as { _def: { procedures: Record<string, unknown> } })._def.procedures;

    expect(procedures).not.toHaveProperty("auth.register");
    expect(procedures).not.toHaveProperty("auth.claimLegacy");
    expect(procedures).toHaveProperty("auth.signIn");
  });

  it("rejects passwords shorter than twelve characters before database access", async () => {
    const { caller } = unauthenticatedCaller();

    await expect(caller.auth.signIn({ email: "admin@kaif.com", password: "too-short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it("rejects an incorrect administrator password without issuing a session", async () => {
    const limit = vi.fn().mockResolvedValue([{ ...administrator, passwordHash: await hashPassword("a-correct-administrator-password") }]);
    mocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })) });
    const { caller, cookies } = unauthenticatedCaller();

    await expect(caller.auth.signIn({ email: "admin@kaif.com", password: "a-wrong-administrator-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(cookies).toHaveLength(0);
  });

  it("issues an HTTPS-only, httpOnly session for valid administrator credentials", async () => {
    const passwordHash = await hashPassword("a-correct-administrator-password");
    const limit = vi.fn().mockResolvedValue([{ ...administrator, passwordHash }]);
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn(() => ({ where }));
    const update = vi.fn(() => ({ set }));
    mocks.getDb.mockResolvedValue({
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })),
      update,
    });
    const { caller, cookies } = unauthenticatedCaller();

    const user = await caller.auth.signIn({ email: "ADMIN@KAIF.COM", password: "a-correct-administrator-password" });

    expect(user).toMatchObject({ id: 1, email: "admin@kaif.com", role: "admin" });
    expect(user).not.toHaveProperty("passwordHash");
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.name).toBe(COOKIE_NAME);
    expect(cookies[0]?.options).toMatchObject({ httpOnly: true, path: "/", sameSite: "lax", secure: true, maxAge: 14 * 24 * 60 * 60 * 1000 });
  });

  it("requires a session for protected restaurant procedures", async () => {
    const { caller } = unauthenticatedCaller();

    await expect(caller.restaurant.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
