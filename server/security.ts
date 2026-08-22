import type { Express } from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { ENV } from "./_core/env";

export const BODY_SIZE_LIMIT = "8mb";

export const RATE_LIMITS = {
  api: { windowMs: 15 * 60 * 1000, limit: 300 },
  auth: { windowMs: 60 * 60 * 1000, limit: 20 },
} as const;

const configuredOrigins = [process.env.FRONTEND_URL, process.env.API_URL]
  .filter((value): value is string => Boolean(value))
  .map(value => {
    try {
      return new URL(value).origin;
    } catch {
      return "";
    }
  })
  .filter(Boolean);

export function isAllowedOrigin(origin?: string, sameOrigin?: string, sameHost?: string): boolean {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    const localDevelopment = process.env.NODE_ENV !== "production" && (host === "localhost" || host === "127.0.0.1");
    return localDevelopment || url.origin === sameOrigin || url.host === sameHost || configuredOrigins.includes(url.origin);
  } catch {
    return false;
  }
}

export function isImageSignatureValid(bytes: Buffer, contentType: "image/jpeg" | "image/png" | "image/webp"): boolean {
  if (contentType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === "image/png") return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
}

export const apiRateLimiter = rateLimit({
  ...RATE_LIMITS.api,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again shortly." } },
});

export const authRateLimiter = rateLimit({
  ...RATE_LIMITS.auth,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "AUTH_RATE_LIMITED", message: "Too many sign-in attempts. Please try again later." } },
});

export function configureSecurity(app: Express) {
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet({
    contentSecurityPolicy: ENV.isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameAncestors: ["'none'"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        upgradeInsecureRequests: [],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }));
  app.use(cors((req, callback) => {
    const origin = req.header("Origin");
    const sameOrigin = `${req.protocol}://${req.get("host")}`;
    const sameHost = req.get("host");
    if (!isAllowedOrigin(origin, sameOrigin, sameHost)) {
      callback(new Error("CORS origin is not allowed"));
      return;
    }
    callback(null, {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type"],
      maxAge: 60 * 60,
    });
  }));
}

type ErrorResponse = {
  status: (code: number) => ErrorResponse;
  json: (body: unknown) => unknown;
};

type ErrorNext = (error?: unknown) => void;

export const securityErrorHandler = (error: unknown, _req: unknown, res: ErrorResponse, next: ErrorNext): void => {
  if (error instanceof Error && error.message === "CORS origin is not allowed") {
    res.status(403).json({ success: false, error: { code: "CORS_ORIGIN_DENIED", message: "This origin is not permitted to access QRServe." } });
    return;
  }
  if (typeof error === "object" && error !== null && "type" in error && error.type === "entity.too.large") {
    res.status(413).json({ success: false, error: { code: "PAYLOAD_TOO_LARGE", message: "Request data exceeds the allowed size." } });
    return;
  }
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ success: false, error: { code: "INVALID_JSON", message: "Request data must be valid JSON." } });
    return;
  }
  next(error);
};
