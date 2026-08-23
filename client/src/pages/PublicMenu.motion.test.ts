import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => {
  const MotionElement = ({
    children,
    initial,
  }: {
    children?: unknown;
    initial?: unknown;
  }) =>
    createElement(
      "div",
      { "data-motion-initial": initial ? "set" : "none" },
      children
    );

  return {
    motion: new Proxy({}, { get: () => MotionElement }),
    useReducedMotion: () => true,
  };
});

vi.mock("@/lib/trpc", () => ({
  trpc: {
    public: {
      menu: { useQuery: () => ({}) },
      trackScan: { useMutation: () => ({ mutate: vi.fn() }) },
    },
  },
}));

import { demoMenuData } from "@/lib/demoMenu";
import { GuestMenu } from "./PublicMenu";

describe("GuestMenu reduced-motion rendering", () => {
  it("removes section and dish reveal props when motion is reduced", () => {
    const html = renderToStaticMarkup(
      createElement(GuestMenu, {
        slug: demoMenuData.restaurant.slug,
        initialMenu: demoMenuData,
        demo: true,
      })
    );

    expect(html).toContain('data-motion-initial="none"');
    expect(html).not.toContain('data-motion-initial="set"');
  });
});
