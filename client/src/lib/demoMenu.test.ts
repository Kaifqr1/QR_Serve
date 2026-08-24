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

  it("uses direct, dish-appropriate public image URLs for every sample dish", () => {
    const items = demoMenuData.categories.flatMap(category => category.items);

    expect(items.every(item => item.imageUrl?.startsWith("https://images.unsplash.com/"))).toBe(true);
    expect(items.some(item => item.name === "Butter chicken" && item.imageUrl?.includes("1742599361498"))).toBe(true);
    expect(items.some(item => item.name === "Chicken dum biryani" && item.imageUrl?.includes("1631515243349"))).toBe(true);
    expect(items.some(item => item.name === "Mango lassi" && item.imageUrl?.includes("1623065422902"))).toBe(true);
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
