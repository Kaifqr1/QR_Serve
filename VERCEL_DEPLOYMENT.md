# QRServe deployment readiness for Vercel

## Current readiness

QRServe now builds a bundled Vercel Function at `api/index.js`, while local development retains the existing Node server. The Vercel build produces frontend assets in the root `public/` directory, and `vercel.json` sends API, storage-proxy, and single-page application routes to the appropriate target. This follows Vercel’s Express deployment model, where an exported Express application is deployed as a serverless function and static assets must be served from `public/**` rather than `express.static()`. [1]

> **Important:** The current project is technically prepared for Vercel deployment, but it is **not production-ready on Vercel until its managed Manus storage and database dependencies are replaced or made externally accessible**. The `BUILT_IN_FORGE_*` credentials are only available inside the managed runtime and must not be copied to Vercel.

## Required Vercel environment variables

Configure the following values in **Production** and, where appropriate, **Preview**. Vercel applies changed environment values only to new deployments, so redeploy after saving them. [2]

| Variable | Required | Purpose and Vercel value |
| --- | --- | --- |
| `DATABASE_URL` | Yes | TLS-enabled connection string for an externally reachable MySQL/TiDB database. Do not use a sandbox-only database endpoint. |
| `JWT_SECRET` | Yes | New high-entropy production signing secret. Do not reuse a development secret. |
| `FRONTEND_URL` | Yes | Final canonical site origin, for example `https://qrserve.vercel.app` or your custom domain. |
| `API_URL` | Same-origin only | Set to the same final origin unless the API moves to a separate domain. |
| `VITE_PUBLIC_SITE_URL` | Yes | Final origin with no trailing slash. The build injects it into canonical, Open Graph, Twitter, and JSON-LD URLs. |

## Required provider changes before a production release

| Area | Current implementation | Required Vercel action |
| --- | --- | --- |
| Image storage | Managed Forge-backed `/manus-storage/*` proxy | Replace `server/storage.ts` with Vercel Blob, S3, Cloudflare R2, or Cloudinary and then remove the Forge storage proxy and `BUILT_IN_FORGE_*` dependency. |
| Database | Managed runtime database variable | Provision an external database, allow Vercel connectivity, enable TLS, and apply migrations outside a request path. |
| Authentication | QRServe email/password accounts stored in TiDB | Run `TIDB_AUTH_MIGRATION.sql` once against the external `qrserve` database before creating the first account. The former `VITE_APP_ID`, `OAUTH_SERVER_URL`, and `VITE_OAUTH_PORTAL_URL` values are no longer required. |
| Rate limiting | In-memory middleware store | For global limits across multiple function instances, add a shared store such as Vercel KV or Upstash Redis before public launch. |
| SEO URLs | Default fallback is `https://qrserve.app` | Set `VITE_PUBLIC_SITE_URL` to the final Vercel/custom domain before the production build. |

## Deployment sequence

1. Export the checkpoint or repository to GitHub, then import it into Vercel.
2. Add the required environment variables. Remove the retired OAuth environment variables after confirming the new credential sign-in screen is live.
3. Provision external database and image-storage providers, migrate the two managed integrations, and run `TIDB_AUTH_MIGRATION.sql` from a controlled administrative session.
4. Create a preview deployment and verify sign-in, restaurant creation, menu image upload, public menu view, QR code scan, and logout.
5. Assign the final domain, set `VITE_PUBLIC_SITE_URL`, redeploy, and validate the canonical/OG URLs before promoting production.

## References

[1] [Vercel, “Express on Vercel”](https://vercel.com/docs/frameworks/backend/express)

[2] [Vercel, “Environment variables”](https://vercel.com/docs/environment-variables)
