import { describe, expect, it } from "vitest";
import { faqItems, serviceSteps } from "./Home";

describe("QRServe local service positioning", () => {
  it("explains the operator-led venue workflow instead of a self-service product flow", () => {
    expect(serviceSteps.map(step => step.title)).toEqual(["Visit & understand", "Build & publish", "Print & keep current"]);
    expect(serviceSteps.map(step => step.copy).join(" ").toLowerCase()).toContain("we review the menu");
    expect(serviceSteps.map(step => step.copy).join(" ").toLowerCase()).toContain("we prepare qr table cards");
  });

  it("answers the practical service questions venue owners ask before setup", () => {
    expect(faqItems).toHaveLength(6);
    expect(faqItems.map(item => item.question)).toContain(
      "What does QRServe set up at my venue?"
    );
    expect(faqItems.map(item => item.answer).join(" ").toLowerCase()).toContain(
      "guests scan the table qr code"
    );
    expect(faqItems.map(item => item.answer).join(" ").toLowerCase()).toContain(
      "qr cards"
    );
  });

  it("offers a professional email route for venue setup enquiries", async () => {
    const { readFile } = await import("node:fs/promises");
    const source = await readFile(new URL("./Home.tsx", import.meta.url), "utf8");

    expect(source).toContain("mailto:Kaif.qr1@gmail.com");
    expect(source).toContain("Plan setup by email");
  });
});
