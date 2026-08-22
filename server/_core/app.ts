import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { apiRateLimiter, authRateLimiter, BODY_SIZE_LIMIT, configureSecurity, securityErrorHandler } from "../security";

/**
 * Creates the HTTP application without binding a port.
 * The local runtime binds this application in index.ts; Vercel imports it as a
 * serverless function through api/index.ts.
 */
export function createQrServeApp() {
  const app = express();
  configureSecurity(app);
  app.use(express.json({ limit: BODY_SIZE_LIMIT, strict: true }));
  app.use(express.urlencoded({ limit: BODY_SIZE_LIMIT, extended: false }));
  app.use("/api/oauth/callback", authRateLimiter);
  app.use("/api/trpc", apiRateLimiter);
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  app.use(securityErrorHandler);
  return app;
}
