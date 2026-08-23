import { describe, expect, it } from "vitest";
import { QR_CARD_STYLES, restaurantMonogram } from "./QRStudio";

describe("QR Studio print card design system", () => {
  it("offers distinct branded print-card styles", () => {
    expect(Object.keys(QR_CARD_STYLES)).toEqual(["editorial", "midnight", "garden"]);
    expect(new Set(Object.values(QR_CARD_STYLES).map(style => style.accent)).size).toBe(3);
  });

  it("uses a compact restaurant monogram only when a logo image is unavailable", () => {
    expect(restaurantMonogram("Bandra Bhandara")).toBe("BB");
    expect(restaurantMonogram("XYZ")).toBe("X");
    expect(restaurantMonogram(" ")).toBe("R");
  });
});
