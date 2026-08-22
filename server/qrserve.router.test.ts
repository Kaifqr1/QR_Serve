import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getOwnedRestaurant: vi.fn(),
}));

vi.mock("./db", () => ({
  getDb: mocks.getDb,
  getOwnedRestaurant: mocks.getOwnedRestaurant,
}));

import { appRouter } from "./routers";

function caller() {
  const ctx: TrpcContext = {
    user: {
      id: 1,
      openId: "owner-1",
      email: "owner@example.com",
      name: "Owner",
      loginMethod: "manus",
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

describe("QRServe protected procedures", () => {
  it("enforces the Free-plan limit before creating a second restaurant", async () => {
    const where = vi.fn().mockResolvedValue([{ id: 1 }]);
    mocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ where })) })) });

    await expect(caller().restaurant.create({ name: "Second Room", location: "Mumbai", description: "" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: expect.stringContaining("Free plan"),
    });
  });

  it("does not expose a restaurant when it is not owned by the active user", async () => {
    mocks.getOwnedRestaurant.mockResolvedValue(undefined);

    await expect(caller().restaurant.get({ id: 55 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects a menu item whose category does not belong to the restaurant", async () => {
    const limit = vi.fn().mockResolvedValue([]);
    mocks.getDb.mockResolvedValue({
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })),
    });
    mocks.getOwnedRestaurant.mockResolvedValue({ id: 1, ownerId: 1, name: "Demo", slug: "demo", location: "Mumbai" });

    await expect(caller().menu.create({ restaurantId: 1, categoryId: 9, name: "Paneer", description: "", price: 320, imageUrl: "", isAvailable: true })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("category"),
    });
  });
});
