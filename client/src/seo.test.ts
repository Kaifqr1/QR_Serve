import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const clientRoot = new URL("../", import.meta.url);

describe("QRServe public search readiness", () => {
  it("uses the production domain as the canonical source and exposes service FAQ schema", async () => {
    const html = await readFile(new URL("index.html", clientRoot), "utf8");

    expect(html).toContain('rel="canonical" href="https://qrserve-menu.vercel.app/"');
    expect(html).toContain('property="og:url" content="https://qrserve-menu.vercel.app/"');
    expect(html).toContain('"@type": "FAQPage"');
    expect(html).toContain("restaurant QR menu setup");
  });

  it("provides valid crawler discovery routes instead of relying on SPA fallbacks", async () => {
    const [robots, sitemap] = await Promise.all([
      readFile(new URL("public/robots.txt", clientRoot), "utf8"),
      readFile(new URL("public/sitemap.xml", clientRoot), "utf8"),
    ]);

    expect(robots).toContain("Sitemap: https://qrserve-menu.vercel.app/sitemap.xml");
    expect(sitemap).toContain("<urlset");
    expect(sitemap).toContain("https://qrserve-menu.vercel.app/demo");
  });

  it("uses a filesystem-first production route before the single-page app fallback", async () => {
    const config = await readFile(new URL("../../vercel.json", import.meta.url), "utf8");

    expect(config).toContain('"handle": "filesystem"');
    expect(config).toContain('"src": "/robots.txt", "dest": "/api/index?crawler=robots"');
    expect(config).toContain('"src": "/sitemap.xml", "dest": "/api/index?crawler=sitemap"');
    expect(config).toContain('"src": "/(.*)", "dest": "/index.html"');
  });
});
