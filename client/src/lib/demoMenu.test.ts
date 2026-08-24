import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { demoMenuData } from "./demoMenu";

describe("QRServe sales demo menu", () => {
  it("offers a shareable, self-contained sample venue without customer data", () => {
    expect(demoMenuData.restaurant.slug).toBe("marigold-table-demo");
    expect(demoMenuData.restaurant.description).toContain("showcase menu");
    expect(demoMenuData.categories).toHaveLength(5);
    expect(
      demoMenuData.categories.flatMap(category => category.items)
    ).toHaveLength(17);
    expect(demoMenuData.categories.map(category => category.name)).toEqual([
      "House favourites",
      "Vegetarian classics",
      "Tandoor & chicken",
      "Coolers & chai",
      "Sweet finish",
    ]);
  });

  it("keeps every sample dish addressable by a unique guest-order identifier", () => {
    const ids = demoMenuData.categories.flatMap(category =>
      category.items.map(item => item.id)
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses a distinct public image URL for every named sample dish", () => {
    const items = demoMenuData.categories.flatMap(category => category.items);
    const imageUrls = items.map(item => item.imageUrl);

    expect(items.every(item => item.imageUrl?.startsWith("https://"))).toBe(true);
    expect(new Set(imageUrls).size).toBe(items.length);
    expect(items.some(item => item.name === "Butter chicken" && item.imageUrl?.includes("Butter_Chicken"))).toBe(true);
    expect(items.some(item => item.name === "Chicken dum biryani" && item.imageUrl?.includes("Chicken_biryani"))).toBe(true);
    expect(items.some(item => item.name === "Kesar badam milk" && item.imageUrl?.includes("Badam_milk"))).toBe(true);
    expect(items.some(item => item.name === "Gulab jamun" && item.imageUrl?.includes("Gulab_Jamun"))).toBe(true);
  });

  it("includes guest-friendly venue details and dietary labels in the showcase", () => {
    const items = demoMenuData.categories.flatMap(category => category.items);

    expect(demoMenuData.restaurant.hours).toContain("Open daily");
    expect(demoMenuData.restaurant.serviceNote).toContain("Dine-in");
    expect(items.every(item => item.dietary && item.dietary.length > 0)).toBe(true);
    expect(items.some(item => item.dietary?.includes("Vegetarian"))).toBe(true);
    expect(items.some(item => item.dietary?.includes("Non-vegetarian"))).toBe(true);
    expect(items.some(item => item.dietary?.includes("Spicy"))).toBe(true);
  });

  it("wires guest-menu section and dish reveals through the reduced-motion-safe helper", async () => {
    const source = await readFile(
      new URL("../pages/PublicMenu.tsx", import.meta.url),
      "utf8"
    );

    expect(source).toContain(
      'import { scrollReveal } from "@/lib/scrollReveal"'
    );
    expect(source).toContain("useReducedMotion()");
    expect(source).toContain(
      "scrollReveal(Boolean(reducedMotion), delay, offset)"
    );
    expect(source).toContain("<motion.section");
    expect(source).toContain("<motion.article");
  });
});
