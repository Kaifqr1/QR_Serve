# Live Vercel Diagnosis — QRServe

## Checked deployment

- **URL:** `https://qr-serve-rust.vercel.app/`
- **Checked:** 2026-08-22

## Observed state

The live domain was serving an older client bundle, `https://qr-serve-rust.vercel.app/assets/index-Da7Ey6xl.js`, rather than the latest Git-synchronized QRServe bundle. Inspection of that older bundle confirmed it contained the broken OAuth initialization path `undefined/app-auth`.

The deployed public auth request to `/api/trpc/auth.me` returns HTTP `500` with `FUNCTION_INVOCATION_FAILED`. The same endpoint succeeds in the local serverless-entrypoint smoke test, returning HTTP `200` and a null user with no session. This confirms the currently checked Vercel deployment predates the latest source repair or is using a stale/failed production deployment.

## Required next verification

Deploy the checkpoint containing the local-auth migration. In the TiDB SQL Editor, run the two statements in `TIDB_AUTH_MIGRATION.sql` exactly once. Then confirm the deployed `/sign-in` page opens, create a new QRServe account, sign out, and sign back in. The public `/api/trpc/auth.me` endpoint should return HTTP `200` and `null` before sign-in rather than a function-invocation failure.

## Function packaging reference

Vercel’s Node.js Function documentation confirms that TypeScript functions must live under the root `api/` directory and that `vercel.json` may define `functions.<glob>.includeFiles` to include additional runtime files. The live error shows the current function bundle did not include the imported application factory at runtime, so the deployment repair will explicitly include `server/**`, `shared/**`, and `drizzle/**` for `api/index.ts`.

**Source:** [Vercel, “Static Configuration with vercel.json”](https://vercel.com/docs/project-configuration/vercel-json); [Vercel, “Using the Node.js Runtime with Vercel Functions”](https://vercel.com/docs/functions/runtimes/node-js).

## Verified bundling repair

The serverless entrypoint is now bundled from `server/_core/vercelFunction.ts` into `api/index.js` during `pnpm run build:vercel`. A local smoke test imports that generated bundle and receives HTTP `200` from `/api/trpc/auth.me`, confirming the former `ERR_MODULE_NOT_FOUND` runtime path is no longer used.

## Superseded OAuth blocker

The previous `invalid redirect_uri` failure was caused by the managed OAuth provider rejecting the Vercel domain. QRServe now uses its own TiDB-backed email/password accounts and signed httpOnly cookies, so no OAuth callback registration is required for this flow. Live verification still requires a fresh Vercel deployment and the TiDB authentication migration.
