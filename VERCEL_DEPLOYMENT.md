# QRServe local-service deployment readiness for Vercel

## Current readiness

QRServe now builds a bundled Vercel Function at `api/index.js`, while local development retains the existing Node server. The Vercel build produces frontend assets in the root `public/` directory, and `vercel.json` sends API and single-page application routes to the appropriate target. This follows Vercel’s Express deployment model, where an exported Express application is deployed as a serverless function and static assets must be served from `public/**` rather than `express.static()`. [1]

> **Important:** Dish-image storage is implemented with Cloudinary’s authenticated server-side SDK. The last required step is adding the Cloudinary API environment variable to Vercel. The legacy `BUILT_IN_FORGE_*` credentials are not used for dish-image uploads and must not be copied to Vercel.

## Required Vercel environment variables

Configure the following values in **Production** and, where appropriate, **Preview**. Vercel applies changed environment values only to new deployments, so redeploy after saving them. [2]

| Variable | Required | Purpose and Vercel value |
| --- | --- | --- |
| `DATABASE_URL` | Yes | TLS-enabled connection string for an externally reachable MySQL/TiDB database. Do not use a sandbox-only database endpoint. |
| `JWT_SECRET` | Yes | New high-entropy production signing secret. Do not reuse a development secret. |
| `FRONTEND_URL` | Yes | Final canonical site origin, for example `https://qrserve.vercel.app` or your custom domain. |
| `API_URL` | Same-origin only | Set to the same final origin unless the API moves to a separate domain. |
| `VITE_PUBLIC_SITE_URL` | Yes | Final origin with no trailing slash. The build injects it into canonical, Open Graph, Twitter, and JSON-LD URLs. |
| `CLOUDINARY_URL` | Yes for dish-image uploads | Copy the **API Environment variable** from Cloudinary’s API Keys page. It must be configured as a server-side Vercel variable and must never use the `VITE_` prefix. |

## Required provider changes before a production release

| Area | Current implementation | Required Vercel action |
| --- | --- | --- |
| Image storage | Authenticated Cloudinary server-side upload | Set `CLOUDINARY_URL` in Vercel for Production and Preview, then redeploy. QRServe validates JPG/PNG/WebP data and signatures, preserves the 5 MB maximum, and stores only Cloudinary’s public HTTPS URL in TiDB. |
| Database | Managed runtime database variable | Provision an external database, allow Vercel connectivity, enable TLS, and apply migrations outside a request path. |
| Authentication | Administrator-only QRServe email/password access stored in TiDB | Run `TIDB_AUTH_MIGRATION.sql` once against the external `qrserve` database before activating the service-operator account. The former `VITE_APP_ID`, `OAUTH_SERVER_URL`, and `VITE_OAUTH_PORTAL_URL` values are no longer required. |
| Rate limiting | In-memory middleware store | For global limits across multiple function instances, add a shared store such as Vercel KV or Upstash Redis before public launch. |
| SEO URLs | Default fallback is `https://qrserve.app` | Set `VITE_PUBLIC_SITE_URL` to the final Vercel/custom domain before the production build. |

## Deployment sequence

1. Export the checkpoint or repository to GitHub, then import it into Vercel.
2. Add the required environment variables. Remove the retired OAuth environment variables after confirming the new credential sign-in screen is live.
3. In Cloudinary’s **API Keys** page, copy the **API Environment variable**. In Vercel, add it as `CLOUDINARY_URL` for Production and Preview. Do not add it as a `VITE_*` variable and do not commit it to source control. [3]
4. Redeploy and verify operator sign-in, client-venue setup, menu image upload, public-menu view, QR table-card scan, and logout.
5. Assign the final domain, set `VITE_PUBLIC_SITE_URL`, redeploy, and validate the canonical/OG URLs before promoting production.

## References

[1] [Vercel, “Express on Vercel”](https://vercel.com/docs/frameworks/backend/express)

[2] [Vercel, “Environment variables”](https://vercel.com/docs/environment-variables)

[3] [Cloudinary, “Node.js SDK configuration”](https://cloudinary.com/documentation/node_integration)
