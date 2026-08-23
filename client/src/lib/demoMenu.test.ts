import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { demoMenuData } from "./demoMenu";

describe("QRServe sales demo menu", () => {
  it("offers a shareable, self-contained sample venue without customer data", () => {
    expect(demoMenuData.restaurant.slug).toBe("marigold-table-demo");
    expect(demoMenuData.restaurant.description).toContain("showcase menu");
    expect(demoMenuData.categories).toHaveLength(4);
    expect(
      demoMenuData.categories.flatMap(category => category.items)
    ).toHaveLength(9);
  });

  it("keeps every sample dish addressable by a unique guest-order identifier", () => {
    const ids = demoMenuData.categories.flatMap(category =>
      category.items.map(item => item.id)
    );
    expect(new Set(ids).size).toBe(ids.length);
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
