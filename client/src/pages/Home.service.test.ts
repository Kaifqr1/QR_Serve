import { describe, expect, it } from "vitest";
import { serviceSteps } from "./Home";

describe("QRServe local service positioning", () => {
  it("explains the operator-led venue workflow instead of a self-service product flow", () => {
    expect(serviceSteps.map(step => step.title)).toEqual(["Visit & understand", "Build & publish", "Print & keep current"]);
    expect(serviceSteps.map(step => step.copy).join(" ").toLowerCase()).toContain("we review the menu");
    expect(serviceSteps.map(step => step.copy).join(" ").toLowerCase()).toContain("we prepare qr table cards");
  });
});
