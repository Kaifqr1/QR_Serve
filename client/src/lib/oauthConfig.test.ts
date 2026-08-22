import { describe, expect, it } from "vitest";
import { getOAuthConfigurationError } from "./oauthConfig";

describe("OAuth configuration", () => {
  it("reports the missing Vercel build variable that prevents sign-in", () => {
    expect(getOAuthConfigurationError(undefined, "app-id")).toContain("VITE_OAUTH_PORTAL_URL");
    expect(getOAuthConfigurationError("https://oauth.example", undefined)).toContain("VITE_APP_ID");
  });

  it("accepts a complete browser OAuth configuration", () => {
    expect(getOAuthConfigurationError("https://oauth.example", "app-id")).toBeNull();
  });
});
