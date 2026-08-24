import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getOwnedRestaurant: vi.fn(),
}));

vi.mock("./db", () => ({
  getDb: mocks.getDb,
  getUserById: vi.fn(),
  getOwnedRestaurant: mocks.getOwnedRestaurant,
}));

import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import { ENV } from "./_core/env";
import { hashPassword, isAllowedVenueOwnerEmail } from "./localAuth";

type CookieCall = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

function unauthenticatedCaller() {
  const cookies: CookieCall[] = [];
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) =>
        cookies.push({ name, value, options }),
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };
  return { caller: appRouter.createCaller(ctx), cookies };
}

function venueOwnerCaller() {
  const ctx: TrpcContext = {
    user: {
      id: 9,
      openId: "venue-owner-9",
      name: "Venue Owner",
      email: "owner@cafe.com",
      passwordHash: "hashed-password",
      loginMethod: "password",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

function administratorCaller() {
  const ctx: TrpcContext = {
    user: administrator,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
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

describe("credential authentication router", () => {
  beforeEach(() => {
    ENV.cookieSecret = "test-session-secret-with-at-least-32-characters";
    mocks.getDb.mockReset();
    mocks.getOwnedRestaurant.mockReset();
  });

  it("exposes restricted venue-owner registration but not legacy claiming", () => {
    const procedures = (
      appRouter as unknown as { _def: { procedures: Record<string, unknown> } }
    )._def.procedures;

    expect(procedures).toHaveProperty("auth.register");
    expect(procedures).not.toHaveProperty("auth.claimLegacy");
    expect(procedures).toHaveProperty("auth.signIn");
  });

  it("only accepts the exact approved venue-owner email domains", () => {
    expect(isAllowedVenueOwnerEmail("OWNER@CAFE.COM")).toBe(true);
    expect(isAllowedVenueOwnerEmail("owner@rastaurant.com")).toBe(true);
    expect(isAllowedVenueOwnerEmail("owner@restaurant.com")).toBe(false);
    expect(isAllowedVenueOwnerEmail("owner@notcafe.com")).toBe(false);
  });

  it("rejects unapproved owner registration before database access", async () => {
    const { caller } = unauthenticatedCaller();

    await expect(
      caller.auth.register({
        name: "Unauthorised Owner",
        email: "owner@example.com",
        password: "a-secure-venue-password",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it("creates an approved venue owner as a non-admin and issues a secure session", async () => {
    const venueOwner = {
      id: 9,
      openId: "venue-generated-id",
      name: "Marigold Owner",
      email: "owner@cafe.com",
      passwordHash: "hashed-password",
      loginMethod: "password",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const existingLimit = vi.fn().mockResolvedValue([]);
    const createdLimit = vi.fn().mockResolvedValue([venueOwner]);
    const select = vi
      .fn()
      .mockReturnValueOnce({
        from: vi.fn(() => ({ where: vi.fn(() => ({ limit: existingLimit })) })),
      })
      .mockReturnValueOnce({
        from: vi.fn(() => ({ where: vi.fn(() => ({ limit: createdLimit })) })),
      });
    const values = vi.fn().mockResolvedValue([{ insertId: 9 }]);
    mocks.getDb.mockResolvedValue({
      select,
      insert: vi.fn(() => ({ values })),
      execute: vi.fn().mockResolvedValue(undefined),
    });
    const { caller, cookies } = unauthenticatedCaller();

    const created = await caller.auth.register({
      name: "Marigold Owner",
      email: "OWNER@CAFE.COM",
      password: "a-secure-venue-password",
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "owner@cafe.com",
        name: "Marigold Owner",
        role: "user",
        loginMethod: "password",
      })
    );
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 9,
        eventType: "VENUE_OWNER_REGISTERED",
        summary: "Venue owner account registered.",
      })
    );
    expect(created).toMatchObject({
      id: 9,
      email: "owner@cafe.com",
      role: "user",
    });
    expect(created).not.toHaveProperty("passwordHash");
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
  });

  it("prevents a standard venue owner from reading or editing another owner’s restaurant", async () => {
    mocks.getOwnedRestaurant.mockResolvedValue(undefined);
    const insert = vi.fn();
    mocks.getDb.mockResolvedValue({ insert });
    const caller = venueOwnerCaller();

    await expect(caller.restaurant.get({ id: 700 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      caller.menu.create({
        restaurantId: 700,
        categoryId: 701,
        name: "Unauthorised dish",
        description: "",
        price: 320,
        imageUrl: "",
        isAvailable: true,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mocks.getOwnedRestaurant).toHaveBeenCalledWith(9, 700);
    expect(insert).not.toHaveBeenCalled();
  });

  it("denies standard venue owners access to the administrator activity feed", async () => {
    const caller = venueOwnerCaller();

    await expect(caller.admin.activity.list({ limit: 20 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it("denies standard venue owners access to the administrator client venue directory", async () => {
    const caller = venueOwnerCaller();

    await expect(caller.restaurant.adminList()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it("allows an administrator to receive owner-attributed client venues", async () => {
    const rows = [
      {
        id: 700,
        ownerId: 9,
        name: "Marigold Café",
        slug: "marigold-cafe-test",
        location: "Bandra West, Mumbai",
        description: "A verification venue.",
        timezone: "Asia/Kolkata",
        logoUrl: null,
        plan: "FREE",
        createdAt: new Date("2026-08-24T10:00:00.000Z"),
        updatedAt: new Date("2026-08-24T10:00:00.000Z"),
        ownerName: "Venue Owner",
        ownerEmail: "owner@cafe.com",
      },
    ];
    const orderBy = vi.fn().mockResolvedValue(rows);
    const leftJoin = vi.fn(() => ({ orderBy }));
    const from = vi.fn(() => ({ leftJoin }));
    mocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from })) });

    await expect(administratorCaller().restaurant.adminList()).resolves.toEqual(rows);
  });

  it("allows an administrator to receive a bounded activity feed", async () => {
    const limit = vi.fn().mockResolvedValue([
      {
        id: 1,
        ownerId: 9,
        ownerName: "Venue Owner",
        ownerEmail: "owner@cafe.com",
        restaurantId: 700,
        restaurantName: "Marigold Café",
        eventType: "MENU_ITEM_CREATED",
        summary: "Created menu item “Masala toast”.",
        createdAt: new Date("2026-08-24T10:00:00.000Z"),
      },
    ]);
    const orderBy = vi.fn(() => ({ limit }));
    const secondLeftJoin = vi.fn(() => ({ orderBy }));
    const firstLeftJoin = vi.fn(() => ({ leftJoin: secondLeftJoin }));
    const from = vi.fn(() => ({ leftJoin: firstLeftJoin }));
    mocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from })) });

    await expect(administratorCaller().admin.activity.list({ limit: 20 })).resolves.toHaveLength(1);
    expect(limit).toHaveBeenCalledWith(20);
  });

  it("reports the active database name without exposing a connection string", async () => {
    const execute = vi
      .fn()
      .mockResolvedValue([[{ databaseName: "qrserve" }], []]);
    mocks.getDb.mockResolvedValue({ execute });
    const { caller } = unauthenticatedCaller();

    await expect(caller.auth.storageStatus()).resolves.toEqual({
      status: "connected",
      databaseName: "qrserve",
    });
  });

  it("classifies credential failures without exposing the underlying error", async () => {
    const driverError = Object.assign(new Error("Access denied for user"), {
      code: "ER_ACCESS_DENIED_ERROR",
    });
    const execute = vi
      .fn()
      .mockRejectedValue(
        Object.assign(new Error("Failed query"), { cause: driverError })
      );
    mocks.getDb.mockResolvedValue({ execute });
    const { caller } = unauthenticatedCaller();

    await expect(caller.auth.storageStatus()).resolves.toEqual({
      status: "error",
      reason: "credentials",
    });
  });

  it("rejects passwords shorter than twelve characters before database access", async () => {
    const { caller } = unauthenticatedCaller();

    await expect(
      caller.auth.signIn({ email: "admin@kaif.com", password: "too-short" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it("rejects an incorrect administrator password without issuing a session", async () => {
    const limit = vi.fn().mockResolvedValue([
      {
        ...administrator,
        passwordHash: await hashPassword("a-correct-administrator-password"),
      },
    ]);
    mocks.getDb.mockResolvedValue({
      select: vi.fn(() => ({
        from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })),
      })),
    });
    const { caller, cookies } = unauthenticatedCaller();

    await expect(
      caller.auth.signIn({
        email: "admin@kaif.com",
        password: "a-wrong-administrator-password",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(cookies).toHaveLength(0);
  });

  it("issues an HTTPS-only, httpOnly session for valid administrator credentials", async () => {
    const passwordHash = await hashPassword("a-correct-administrator-password");
    const limit = vi
      .fn()
      .mockResolvedValue([{ ...administrator, passwordHash }]);
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn(() => ({ where }));
    const update = vi.fn(() => ({ set }));
    mocks.getDb.mockResolvedValue({
      select: vi.fn(() => ({
        from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })),
      })),
      update,
    });
    const { caller, cookies } = unauthenticatedCaller();

    const user = await caller.auth.signIn({
      email: "ADMIN@KAIF.COM",
      password: "a-correct-administrator-password",
    });

    expect(user).toMatchObject({
      id: 1,
      email: "admin@kaif.com",
      role: "admin",
    });
    expect(user).not.toHaveProperty("passwordHash");
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.name).toBe(COOKIE_NAME);
    expect(cookies[0]?.options).toMatchObject({
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });
  });

  it("requires a session for protected restaurant procedures", async () => {
    const { caller } = unauthenticatedCaller();

    await expect(caller.restaurant.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
