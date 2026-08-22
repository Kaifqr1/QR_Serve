// server/_core/app.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/_core/env.ts
var ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  app.get("/manus-storage/*key", async (req, res) => {
    const rawKey = req.params.key;
    const key = Array.isArray(rawKey) ? rawKey.join("/") : rawKey;
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/routers.ts
import { and as and2, asc, count, eq as eq2 } from "drizzle-orm";
import { TRPCError as TRPCError3 } from "@trpc/server";
import { nanoid } from "nanoid";
import { z as z3 } from "zod";

// drizzle/schema.ts
import { boolean, decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
}, (table) => [uniqueIndex("users_email_unique").on(table.email)]);
var restaurants = mysqlTable("restaurants", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  location: varchar("location", { length: 120 }).notNull(),
  description: text("description"),
  timezone: varchar("timezone", { length: 80 }).notNull().default("Asia/Kolkata"),
  logoUrl: text("logoUrl"),
  plan: mysqlEnum("plan", ["FREE", "STARTER", "PRO"]).notNull().default("FREE"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => [uniqueIndex("restaurants_slug_unique").on(table.slug), index("restaurants_owner_idx").on(table.ownerId)]);
var menuCategories = mysqlTable("menuCategories", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 48 }).notNull(),
  description: varchar("description", { length: 160 }),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => [index("categories_restaurant_idx").on(table.restaurantId)]);
var menuItems = mysqlTable("menuItems", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull().references(() => menuCategories.id, { onDelete: "cascade" }),
  restaurantId: int("restaurantId").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  description: varchar("description", { length: 280 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  sortOrder: int("sortOrder").notNull().default(0),
  isAvailable: boolean("isAvailable").notNull().default(true),
  version: int("version").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => [index("items_restaurant_idx").on(table.restaurantId), index("items_category_idx").on(table.categoryId)]);
var analyticsEvents = mysqlTable("analyticsEvents", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  menuItemId: int("menuItemId").references(() => menuItems.id, { onDelete: "set null" }),
  eventType: mysqlEnum("eventType", ["MENU_VIEW", "QR_SCAN", "ITEM_VIEW"]).notNull(),
  userAgent: varchar("userAgent", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
}, (table) => [index("analytics_restaurant_idx").on(table.restaurantId), index("analytics_created_idx").on(table.createdAt)]);

// shared/qrserve.ts
import { z } from "zod";
var planLimits = {
  FREE: 1,
  STARTER: 3,
  PRO: Number.POSITIVE_INFINITY
};
var restaurantInput = z.object({
  name: z.string().trim().min(2, "Restaurant name must be at least 2 characters.").max(80),
  location: z.string().trim().min(2, "Location is required.").max(120),
  description: z.string().trim().max(320).optional().default(""),
  timezone: z.string().trim().max(80).optional().default("Asia/Kolkata"),
  logoUrl: z.string().url().optional().or(z.literal("")).default("")
});
var restaurantUpdateInput = restaurantInput.extend({
  id: z.number().int().positive()
});
var categoryInput = z.object({
  restaurantId: z.number().int().positive(),
  name: z.string().trim().min(2, "Category name must be at least 2 characters.").max(48),
  description: z.string().trim().max(160).optional().default("")
});
var categoryUpdateInput = categoryInput.pick({ name: true, description: true }).extend({
  id: z.number().int().positive()
});
var menuItemInput = z.object({
  restaurantId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  name: z.string().trim().min(2, "Menu item name must be at least 2 characters.").max(80),
  description: z.string().trim().max(280).optional().default(""),
  price: z.coerce.number().min(0, "Price cannot be negative.").max(999999),
  imageUrl: z.string().url().optional().or(z.literal("")).default(""),
  isAvailable: z.boolean().default(true)
});
var menuItemUpdateInput = menuItemInput.partial().extend({
  id: z.number().int().positive(),
  categoryId: z.number().int().positive().optional(),
  name: z.string().trim().min(2, "Menu item name must be at least 2 characters.").max(80).optional(),
  description: z.string().trim().max(280).optional(),
  price: z.coerce.number().min(0, "Price cannot be negative.").max(999999).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")).optional(),
  isAvailable: z.boolean().optional()
});
var imageUploadInput = z.object({
  filename: z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9._ -]+$/, "Use a simple image filename.").refine((value) => !value.startsWith(".") && !value.includes(".."), "Use a safe image filename."),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  dataUrl: z.string().min(50).max(7e6)
});

// server/db.ts
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
var database = null;
async function getDb() {
  if (!database && process.env.DATABASE_URL) database = drizzle(process.env.DATABASE_URL);
  return database;
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}
async function getOwnedRestaurant(ownerId, restaurantId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(restaurants).where(and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, ownerId))).limit(1);
  return result[0];
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers?.["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    // The hosted development preview runs inside an iframe on a different site.
    // Its HTTPS requests need a third-party cookie; production remains same-origin.
    sameSite: !ENV.isProduction && secure ? "none" : "lax",
    secure
  };
}

// server/_core/systemRouter.ts
import { z as z2 } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z2.object({
      timestamp: z2.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z2.object({
      title: z2.string().min(1, "title is required"),
      content: z2.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/storage.ts
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash2 = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash2}`;
  return `${relKey.slice(0, lastDot)}_${hash2}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}

// server/security.ts
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
var BODY_SIZE_LIMIT = "8mb";
var RATE_LIMITS = {
  api: { windowMs: 15 * 60 * 1e3, limit: 300 },
  auth: { windowMs: 60 * 60 * 1e3, limit: 20 }
};
var configuredOrigins = [process.env.FRONTEND_URL, process.env.API_URL].filter((value) => Boolean(value)).map((value) => {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}).filter(Boolean);
function isAllowedOrigin(origin, sameOrigin, sameHost) {
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
function isImageSignatureValid(bytes, contentType) {
  if (contentType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (contentType === "image/png") return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
}
var apiRateLimiter = rateLimit({
  ...RATE_LIMITS.api,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again shortly." } }
});
var authRateLimiter = rateLimit({
  ...RATE_LIMITS.auth,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "AUTH_RATE_LIMITED", message: "Too many sign-in attempts. Please try again later." } }
});
function configureSecurity(app) {
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
        upgradeInsecureRequests: []
      }
    } : false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
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
      maxAge: 60 * 60
    });
  }));
}
var securityErrorHandler = (error, _req, res, next) => {
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

// server/localAuth.ts
import { compare, hash } from "bcryptjs";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var LOCAL_SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1e3;
var DEVELOPMENT_SESSION_SECRET = "qrserve-development-session-secret-not-for-production";
function sessionKey() {
  if (ENV.cookieSecret.length >= 32) return new TextEncoder().encode(ENV.cookieSecret);
  if (ENV.isProduction) throw new Error("JWT_SECRET must be at least 32 characters in production.");
  return new TextEncoder().encode(DEVELOPMENT_SESSION_SECRET);
}
function getHeader(req, name) {
  const value = req.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}
function normaliseEmail(email) {
  return email.trim().toLowerCase();
}
async function verifyPassword(password, passwordHash) {
  return compare(password, passwordHash);
}
async function createCredentialSession(userId) {
  return new SignJWT({ uid: userId, kind: "qrserve-password" }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setIssuedAt().setExpirationTime(Math.floor((Date.now() + LOCAL_SESSION_MAX_AGE_MS) / 1e3)).sign(sessionKey());
}
async function getCredentialSessionUser(req) {
  const rawCookie = getHeader(req, "cookie");
  const token = rawCookie ? parseCookieHeader(rawCookie)[COOKIE_NAME] : void 0;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { algorithms: ["HS256"] });
    if (payload.kind !== "qrserve-password" || typeof payload.uid !== "number" || !Number.isInteger(payload.uid)) return null;
    return await getUserById(payload.uid) ?? null;
  } catch {
    return null;
  }
}
async function getLegacySessionOpenId(req) {
  const rawCookie = getHeader(req, "cookie");
  const token = rawCookie ? parseCookieHeader(rawCookie)[COOKIE_NAME] : void 0;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { algorithms: ["HS256"] });
    const legacy = payload;
    return typeof legacy.openId === "string" && legacy.openId.length > 0 && typeof legacy.appId === "string" && legacy.appId.length > 0 ? legacy.openId : null;
  } catch {
    return null;
  }
}
function publicUser(user) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

// server/routers.ts
var idInput = z3.object({ id: z3.number().int().positive() });
var restaurantIdInput = z3.object({ restaurantId: z3.number().int().positive() });
var credentialsInput = z3.object({ email: z3.string().trim().email().max(320), password: z3.string().min(12).max(128) });
async function database2() {
  const db = await getDb();
  if (!db) throw new TRPCError3({ code: "PRECONDITION_FAILED", message: "QRServe data storage is not available yet. Please try again shortly." });
  return db;
}
async function owned(ownerId, restaurantId) {
  const restaurant = await getOwnedRestaurant(ownerId, restaurantId);
  if (!restaurant) throw new TRPCError3({ code: "NOT_FOUND", message: "Restaurant not found or access is not permitted." });
  return restaurant;
}
function slugify(name) {
  const root = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90);
  return `${root || "restaurant"}-${nanoid(6).toLowerCase()}`;
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user ? publicUser(opts.ctx.user) : null),
    signIn: publicProcedure.input(credentialsInput).mutation(async ({ ctx, input }) => {
      const db = await database2();
      const user = await db.select().from(users).where(eq2(users.email, normaliseEmail(input.email))).limit(1);
      if (!user[0]?.passwordHash || !await verifyPassword(input.password, user[0].passwordHash)) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Incorrect email or password." });
      await db.update(users).set({ lastSignedIn: /* @__PURE__ */ new Date() }).where(eq2(users.id, user[0].id));
      const token = await createCredentialSession(user[0].id);
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: LOCAL_SESSION_MAX_AGE_MS });
      return publicUser(user[0]);
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  restaurant: router({
    list: protectedProcedure.query(async ({ ctx }) => (await database2()).select().from(restaurants).where(eq2(restaurants.ownerId, ctx.user.id)).orderBy(asc(restaurants.createdAt))),
    get: protectedProcedure.input(idInput).query(async ({ ctx, input }) => owned(ctx.user.id, input.id)),
    create: protectedProcedure.input(restaurantInput).mutation(async ({ ctx, input }) => {
      const db = await database2();
      const existing = await db.select({ id: restaurants.id }).from(restaurants).where(eq2(restaurants.ownerId, ctx.user.id));
      if (existing.length >= planLimits.FREE) throw new TRPCError3({ code: "FORBIDDEN", message: "The Free plan includes one restaurant. Upgrade your plan to add another." });
      const result = await db.insert(restaurants).values({ ownerId: ctx.user.id, name: input.name, slug: slugify(input.name), location: input.location, description: input.description || null, timezone: input.timezone, logoUrl: input.logoUrl || null, plan: "FREE" });
      const row = await db.select().from(restaurants).where(eq2(restaurants.id, Number(result[0].insertId))).limit(1);
      return row[0];
    }),
    update: protectedProcedure.input(restaurantUpdateInput).mutation(async ({ ctx, input }) => {
      const db = await database2();
      await owned(ctx.user.id, input.id);
      await db.update(restaurants).set({ name: input.name, location: input.location, description: input.description || null, timezone: input.timezone, logoUrl: input.logoUrl || null }).where(eq2(restaurants.id, input.id));
      return { success: true };
    }),
    delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
      const db = await database2();
      await owned(ctx.user.id, input.id);
      await db.delete(restaurants).where(eq2(restaurants.id, input.id));
      return { success: true };
    })
  }),
  category: router({
    list: protectedProcedure.input(restaurantIdInput).query(async ({ ctx, input }) => {
      await owned(ctx.user.id, input.restaurantId);
      return (await database2()).select().from(menuCategories).where(eq2(menuCategories.restaurantId, input.restaurantId)).orderBy(asc(menuCategories.sortOrder));
    }),
    create: protectedProcedure.input(categoryInput).mutation(async ({ ctx, input }) => {
      const db = await database2();
      await owned(ctx.user.id, input.restaurantId);
      const existing = await db.select({ id: menuCategories.id }).from(menuCategories).where(eq2(menuCategories.restaurantId, input.restaurantId));
      const result = await db.insert(menuCategories).values({ restaurantId: input.restaurantId, name: input.name, description: input.description || null, sortOrder: existing.length });
      const row = await db.select().from(menuCategories).where(eq2(menuCategories.id, Number(result[0].insertId))).limit(1);
      return row[0];
    }),
    update: protectedProcedure.input(categoryUpdateInput).mutation(async ({ ctx, input }) => {
      const db = await database2();
      const current = await db.select().from(menuCategories).where(eq2(menuCategories.id, input.id)).limit(1);
      if (!current[0]) throw new TRPCError3({ code: "NOT_FOUND", message: "Category not found." });
      await owned(ctx.user.id, current[0].restaurantId);
      await db.update(menuCategories).set({ name: input.name, description: input.description || null }).where(eq2(menuCategories.id, input.id));
      return { success: true };
    }),
    delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
      const db = await database2();
      const current = await db.select().from(menuCategories).where(eq2(menuCategories.id, input.id)).limit(1);
      if (!current[0]) throw new TRPCError3({ code: "NOT_FOUND", message: "Category not found." });
      await owned(ctx.user.id, current[0].restaurantId);
      await db.delete(menuCategories).where(eq2(menuCategories.id, input.id));
      return { success: true };
    })
  }),
  menu: router({
    list: protectedProcedure.input(restaurantIdInput).query(async ({ ctx, input }) => {
      await owned(ctx.user.id, input.restaurantId);
      const rows = await (await database2()).select().from(menuItems).where(eq2(menuItems.restaurantId, input.restaurantId)).orderBy(asc(menuItems.sortOrder));
      return rows.map((row) => ({ ...row, price: Number(row.price) }));
    }),
    create: protectedProcedure.input(menuItemInput).mutation(async ({ ctx, input }) => {
      const db = await database2();
      await owned(ctx.user.id, input.restaurantId);
      const category = await db.select().from(menuCategories).where(and2(eq2(menuCategories.id, input.categoryId), eq2(menuCategories.restaurantId, input.restaurantId))).limit(1);
      if (!category[0]) throw new TRPCError3({ code: "BAD_REQUEST", message: "Choose a category belonging to this restaurant." });
      const order = await db.select({ id: menuItems.id }).from(menuItems).where(eq2(menuItems.categoryId, input.categoryId));
      const result = await db.insert(menuItems).values({ restaurantId: input.restaurantId, categoryId: input.categoryId, name: input.name, description: input.description || null, price: input.price.toFixed(2), imageUrl: input.imageUrl || null, isAvailable: input.isAvailable, sortOrder: order.length });
      const row = await db.select().from(menuItems).where(eq2(menuItems.id, Number(result[0].insertId))).limit(1);
      return row[0] ? { ...row[0], price: Number(row[0].price) } : null;
    }),
    update: protectedProcedure.input(menuItemUpdateInput).mutation(async ({ ctx, input }) => {
      const db = await database2();
      const current = await db.select().from(menuItems).where(eq2(menuItems.id, input.id)).limit(1);
      if (!current[0]) throw new TRPCError3({ code: "NOT_FOUND", message: "Menu item not found." });
      await owned(ctx.user.id, current[0].restaurantId);
      if (input.categoryId !== void 0) {
        const category = await db.select().from(menuCategories).where(and2(eq2(menuCategories.id, input.categoryId), eq2(menuCategories.restaurantId, current[0].restaurantId))).limit(1);
        if (!category[0]) throw new TRPCError3({ code: "BAD_REQUEST", message: "Choose a category belonging to this restaurant." });
      }
      await db.update(menuItems).set({ ...input.categoryId !== void 0 ? { categoryId: input.categoryId } : {}, ...input.name !== void 0 ? { name: input.name } : {}, ...input.description !== void 0 ? { description: input.description || null } : {}, ...input.price !== void 0 ? { price: input.price.toFixed(2) } : {}, ...input.imageUrl !== void 0 ? { imageUrl: input.imageUrl || null } : {}, ...input.isAvailable !== void 0 ? { isAvailable: input.isAvailable } : {}, version: current[0].version + 1 }).where(eq2(menuItems.id, input.id));
      return { success: true };
    }),
    delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
      const db = await database2();
      const current = await db.select().from(menuItems).where(eq2(menuItems.id, input.id)).limit(1);
      if (!current[0]) throw new TRPCError3({ code: "NOT_FOUND", message: "Menu item not found." });
      await owned(ctx.user.id, current[0].restaurantId);
      await db.delete(menuItems).where(eq2(menuItems.id, input.id));
      return { success: true };
    }),
    uploadImage: protectedProcedure.input(imageUploadInput).mutation(async ({ ctx, input }) => {
      const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(input.dataUrl);
      if (!match || match[1] !== input.contentType) throw new TRPCError3({ code: "BAD_REQUEST", message: "Please choose a valid JPG, PNG, or WebP image." });
      const bytes = Buffer.from(match[2], "base64");
      if (bytes.byteLength > 5e6) throw new TRPCError3({ code: "PAYLOAD_TOO_LARGE", message: "Image files must be 5 MB or smaller." });
      if (!isImageSignatureValid(bytes, input.contentType)) throw new TRPCError3({ code: "BAD_REQUEST", message: "The image content does not match its declared file type." });
      return storagePut(`qrserve/${ctx.user.id}/menu-images/${input.filename.replace(/\s+/g, "-").toLowerCase()}`, bytes, input.contentType);
    })
  }),
  public: router({
    menu: publicProcedure.input(z3.object({ slug: z3.string().trim().min(1).max(120) })).query(async ({ input, ctx }) => {
      const db = await database2();
      const restaurant = await db.select().from(restaurants).where(eq2(restaurants.slug, input.slug)).limit(1);
      if (!restaurant[0]) throw new TRPCError3({ code: "NOT_FOUND", message: "This menu is no longer available." });
      const categories = await db.select().from(menuCategories).where(eq2(menuCategories.restaurantId, restaurant[0].id)).orderBy(asc(menuCategories.sortOrder));
      const items = await db.select().from(menuItems).where(and2(eq2(menuItems.restaurantId, restaurant[0].id), eq2(menuItems.isAvailable, true))).orderBy(asc(menuItems.sortOrder));
      const userAgent = Array.isArray(ctx.req.headers["user-agent"]) ? ctx.req.headers["user-agent"][0] : ctx.req.headers["user-agent"];
      await db.insert(analyticsEvents).values({ restaurantId: restaurant[0].id, eventType: "MENU_VIEW", userAgent: userAgent?.slice(0, 500) ?? null });
      return {
        restaurant: {
          name: restaurant[0].name,
          slug: restaurant[0].slug,
          location: restaurant[0].location,
          description: restaurant[0].description,
          logoUrl: restaurant[0].logoUrl
        },
        categories: categories.map((category) => ({
          id: category.id,
          name: category.name,
          description: category.description,
          items: items.filter((item) => item.categoryId === category.id).map((item) => ({
            id: item.id,
            categoryId: item.categoryId,
            name: item.name,
            description: item.description,
            price: Number(item.price),
            imageUrl: item.imageUrl
          }))
        }))
      };
    }),
    trackScan: publicProcedure.input(z3.object({ slug: z3.string().trim().min(1).max(120) })).mutation(async ({ input }) => {
      const db = await database2();
      const restaurant = await db.select({ id: restaurants.id }).from(restaurants).where(eq2(restaurants.slug, input.slug)).limit(1);
      if (!restaurant[0]) throw new TRPCError3({ code: "NOT_FOUND", message: "This menu is no longer available." });
      await db.insert(analyticsEvents).values({ restaurantId: restaurant[0].id, eventType: "QR_SCAN" });
      return { success: true };
    })
  }),
  analytics: router({
    summary: protectedProcedure.input(restaurantIdInput).query(async ({ ctx, input }) => {
      const db = await database2();
      await owned(ctx.user.id, input.restaurantId);
      const [views, scans, items, categories] = await Promise.all([
        db.select({ total: count() }).from(analyticsEvents).where(and2(eq2(analyticsEvents.restaurantId, input.restaurantId), eq2(analyticsEvents.eventType, "MENU_VIEW"))),
        db.select({ total: count() }).from(analyticsEvents).where(and2(eq2(analyticsEvents.restaurantId, input.restaurantId), eq2(analyticsEvents.eventType, "QR_SCAN"))),
        db.select({ total: count() }).from(menuItems).where(eq2(menuItems.restaurantId, input.restaurantId)),
        db.select({ total: count() }).from(menuCategories).where(eq2(menuCategories.restaurantId, input.restaurantId))
      ]);
      return { views: Number(views[0]?.total ?? 0), scans: Number(scans[0]?.total ?? 0), items: Number(items[0]?.total ?? 0), categories: Number(categories[0]?.total ?? 0) };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  let legacyOpenId = null;
  try {
    user = await getCredentialSessionUser(opts.req);
    if (!user) legacyOpenId = await getLegacySessionOpenId(opts.req);
  } catch (error) {
    user = null;
    legacyOpenId = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user,
    legacyOpenId
  };
}

// server/_core/app.ts
function createQrServeApp() {
  const app = express();
  configureSecurity(app);
  app.use(express.json({ limit: BODY_SIZE_LIMIT, strict: true }));
  app.use(express.urlencoded({ limit: BODY_SIZE_LIMIT, extended: false }));
  app.use("/api/trpc/auth.signIn", authRateLimiter);
  app.use("/api/trpc/auth.register", authRateLimiter);
  app.use("/api/trpc", apiRateLimiter);
  registerStorageProxy(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  app.use(securityErrorHandler);
  return app;
}

// server/_core/vercelFunction.ts
var vercelFunction_default = createQrServeApp();
export {
  vercelFunction_default as default
};
