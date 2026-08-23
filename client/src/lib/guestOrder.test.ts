import { describe, expect, it } from "vitest";
import { addToGuestOrder, guestOrderItemCount, guestOrderStorageKey, guestOrderTotal, setGuestOrderQuantity } from "./guestOrder";

describe("guest order list", () => {
  const paneer = { id: 11, name: "Paneer tikka", price: 320, imageUrl: null };
  const naan = { id: 12, name: "Garlic naan", price: 85, imageUrl: null };

  it("adds dishes, consolidates duplicates, and calculates item count and total", () => {
    const order = addToGuestOrder(addToGuestOrder(addToGuestOrder([], paneer), paneer), naan);

    expect(order).toEqual([
      { ...paneer, quantity: 2 },
      { ...naan, quantity: 1 },
    ]);
    expect(guestOrderItemCount(order)).toBe(3);
    expect(guestOrderTotal(order)).toBe(725);
  });

  it("changes quantities, removes zero-quantity dishes, and keeps each menu private", () => {
    const withPaneer = addToGuestOrder([], paneer);
    expect(setGuestOrderQuantity(withPaneer, paneer.id, 3)[0]?.quantity).toBe(3);
    expect(setGuestOrderQuantity(withPaneer, paneer.id, 0)).toEqual([]);
    expect(guestOrderStorageKey("bandra-bhandara")).toBe("qrserve:guest-order:bandra-bhandara");
  });
});
