import { createQrServeApp } from "./app";

/**
 * Source entrypoint for the Vercel Node Function bundle. The Vercel build
 * script bundles this module and all QRServe server files into api/index.js,
 * avoiding runtime cross-directory TypeScript imports inside /var/task.
 */
export default createQrServeApp();
