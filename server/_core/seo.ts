export const PUBLIC_SITE_URL = "https://qrserve-menu.vercel.app";

export const robotsText = `User-agent: *
Allow: /
Disallow: /app
Disallow: /sign-in

Sitemap: ${PUBLIC_SITE_URL}/sitemap.xml
`;

export const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${PUBLIC_SITE_URL}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${PUBLIC_SITE_URL}/demo</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
`;
