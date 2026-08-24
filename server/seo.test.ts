import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { PUBLIC_SITE_URL, robotsText, sitemapXml } from "./_core/seo";

describe("public crawler documents", () => {
  it("keeps the production crawler documents aligned to the preferred QRServe alias", () => {
    expect(robotsText).toContain(`Sitemap: ${PUBLIC_SITE_URL}/sitemap.xml`);
    expect(sitemapXml).toContain(`<loc>${PUBLIC_SITE_URL}/</loc>`);
    expect(sitemapXml).toContain(`<loc>${PUBLIC_SITE_URL}/demo</loc>`);
  });

  it("serves crawler documents at their original root paths when Vercel forwards a rewrite to Express", async () => {
    const appSource = await readFile(
      new URL("./_core/app.ts", import.meta.url),
      "utf8"
    );

    expect(appSource).toContain('app.get("/robots.txt"');
    expect(appSource).toContain('app.get("/sitemap.xml"');
  });
});
