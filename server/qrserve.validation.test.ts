import { describe, expect, it } from "vitest";
import { imageUploadInput, menuItemInput, restaurantInput } from "../shared/qrserve";

describe("QRServe input contracts", () => {
  it("accepts a complete restaurant setup", () => {
    const result = restaurantInput.safeParse({ name: "Jamun Kitchen", location: "Bandra West, Mumbai", description: "Modern Indian food" });
    expect(result.success).toBe(true);
  });
  it("rejects short restaurant names and negative menu prices", () => {
    expect(restaurantInput.safeParse({ name: "A", location: "Mumbai" }).success).toBe(false);
    expect(menuItemInput.safeParse({ restaurantId: 1, categoryId: 1, name: "Tikka", price: -1 }).success).toBe(false);
  });
  it("only allows supported menu-image content types", () => {
    expect(imageUploadInput.safeParse({ filename: "dish.gif", contentType: "image/gif", dataUrl: "data:image/gif;base64,AAAA" }).success).toBe(false);
  });
});
