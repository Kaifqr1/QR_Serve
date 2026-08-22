# Live Vercel Diagnosis — QRServe

## Checked deployment

- **URL:** `https://qr-serve-rust.vercel.app/`
- **Checked:** 2026-08-22

## Observed state

The live domain is currently serving the older client bundle `https://qr-serve-rust.vercel.app/assets/index-Da7Ey6xl.js`, rather than the latest Git-synchronized QRServe bundle. Inspection of that bundle confirmed it contains the broken OAuth initialization path `undefined/app-auth` and does not contain the newly added user-facing fallback text, `Sign-in is not configured yet`.

The deployed public auth request to `/api/trpc/auth.me` returns HTTP `500` with `FUNCTION_INVOCATION_FAILED`. The same endpoint succeeds in the local serverless-entrypoint smoke test, returning HTTP `200` and a null user with no session. This confirms the currently checked Vercel deployment predates the latest source repair or is using a stale/failed production deployment.

## Required next verification

Trigger or wait for a Vercel deployment that uses Git commit `3e8cf143` or later. Confirm that the generated asset URL changes, the public auth endpoint returns HTTP `200`, and the bundle contains the OAuth fallback. Then set `VITE_OAUTH_PORTAL_URL` and `VITE_APP_ID` in Vercel Production, register the Vercel callback URL, and redeploy before testing actual sign-in.

## Function packaging reference

Vercel’s Node.js Function documentation confirms that TypeScript functions must live under the root `api/` directory and that `vercel.json` may define `functions.<glob>.includeFiles` to include additional runtime files. The live error shows the current function bundle did not include the imported application factory at runtime, so the deployment repair will explicitly include `server/**`, `shared/**`, and `drizzle/**` for `api/index.ts`.

**Source:** [Vercel, “Static Configuration with vercel.json”](https://vercel.com/docs/project-configuration/vercel-json); [Vercel, “Using the Node.js Runtime with Vercel Functions”](https://vercel.com/docs/functions/runtimes/node-js).

## Verified bundling repair

The serverless entrypoint is now bundled from `server/_core/vercelFunction.ts` into `api/index.js` during `pnpm run build:vercel`. A local smoke test imports that generated bundle and receives HTTP `200` from `/api/trpc/auth.me`, confirming the former `ERR_MODULE_NOT_FOUND` runtime path is no longer used.

## Remaining OAuth blocker

The deployed sign-in attempt returned: `invalid redirect_uri: redirect_uri domain 'qr-serve-three.vercel.app' not allowed for this project`. This is an OAuth-provider application-registration restriction, not a Vercel or database configuration error. Adding Vercel environment variables alone cannot authorize the redirect. Before live sign-in can work, either register the final Vercel domain with the OAuth provider for this application, if that provider administration is available, or replace the managed Manus OAuth integration with a Vercel-compatible authentication provider.
