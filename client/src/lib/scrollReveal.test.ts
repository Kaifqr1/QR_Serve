import { describe, expect, it } from "vitest";
import { scrollReveal } from "./scrollReveal";

describe("scrollReveal", () => {
  it("renders content without animation props when reduced motion is requested", () => {
    expect(scrollReveal(true)).toEqual({});
  });

  it("uses a one-time viewport reveal with the requested delay and offset", () => {
    const result = scrollReveal(false, 0.16, 18);
    expect(result).toMatchObject({
      initial: { opacity: 0, y: 18 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, amount: 0.22 },
      transition: { duration: 0.64, delay: 0.16 },
    });
  });
});
