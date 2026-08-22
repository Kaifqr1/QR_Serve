import { and, asc, count, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { analyticsEvents, menuCategories, menuItems, restaurants, users } from "../drizzle/schema";
import { categoryInput, categoryUpdateInput, imageUploadInput, menuItemInput, menuItemUpdateInput, planLimits, restaurantInput, restaurantUpdateInput } from "../shared/qrserve";
import { getDb, getOwnedRestaurant } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { StorageConfigurationError, storagePut } from "./storage";
import { COOKIE_NAME } from "@shared/const";
import { isImageSignatureValid } from "./security";
import { createCredentialSession, hashPassword, LOCAL_SESSION_MAX_AGE_MS, normaliseEmail, publicUser, verifyPassword } from "./localAuth";

const idInput = z.object({ id: z.number().int().positive() });
const restaurantIdInput = z.object({ restaurantId: z.number().int().positive() });
const credentialsInput = z.object({ email: z.string().trim().email().max(320), password: z.string().min(12).max(128) });

async function database() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "QRServe data storage is not available yet. Please try again shortly." });
  return db;
}

function safeImageStorageFailure(error: unknown) {
  const record = typeof error === "object" && error !== null ? error as { name?: unknown; message?: unknown; http_code?: unknown } : {};
  const message = typeof record.message === "string"
    ? record.message
      .replace(/cloudinary:\/\/[^@\s]+@/gi, "cloudinary://[redacted]@")
      .replace(/(api[_-]?secret|api[_-]?key|token)=([^\s&]+)/gi, "$1=[redacted]")
      .slice(0, 400)
    : "Unknown storage error";
  return {
    name: typeof record.name === "string" ? record.name.slice(0, 80) : "StorageError",
    httpCode: typeof record.http_code === "number" ? record.http_code : undefined,
    message,
  };
}

async function owned(ownerId: number, restaurantId: number) {
  const restaurant = await getOwnedRestaurant(ownerId, restaurantId);
  if (!restaurant) throw new TRPCError({ code: "NOT_FOUND", message: "Restaurant not found or access is not permitted." });
  return restaurant;
}

function slugify(name: string) {
  const root = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90);
  return `${root || "restaurant"}-${nanoid(6).toLowerCase()}`;
}

function isDuplicateKeyError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error.code === "ER_DUP_ENTRY" || error.code === 1062);
}

function classifyDatabaseConnectionError(error: unknown) {
  const seen = new Set<unknown>();
  const details: string[] = [];
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const record = current as { code?: unknown; message?: unknown; cause?: unknown };
    if (record.code) details.push(String(record.code).toLowerCase());
    if (typeof record.message === "string") details.push(record.message.toLowerCase());
    current = record.cause;
  }
  const detail = details.join(" ");
  if (/unknown (column|table)|doesn't exist|no database selected/.test(detail)) return "schema" as const;
  if (/access denied|authentication|er_access_denied|password/.test(detail)) return "credentials" as const;
  if (/ssl|tls|certificate|handshake/.test(detail)) return "tls" as const;
  if (/invalid.*url|malformed|uri/.test(detail)) return "format" as const;
  if (/enotfound|econnrefused|etimedout|getaddrinfo|network/.test(detail)) return "network" as const;
  return "connection" as const;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user ? publicUser(opts.ctx.user) : null),
    storageStatus: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { status: "missing" as const };
      try {
        const [rows] = await db.execute(sql`SELECT DATABASE() AS databaseName`) as unknown as [Array<{ databaseName: string | null }>];
        return { status: "connected" as const, databaseName: rows[0]?.databaseName ?? null };
      } catch (error) {
        return { status: "error" as const, reason: classifyDatabaseConnectionError(error) };
      }
    }),
    signIn: publicProcedure.input(credentialsInput).mutation(async ({ ctx, input }) => {
      const db = await database();
      const user = await db.select().from(users).where(eq(users.email, normaliseEmail(input.email))).limit(1);
      if (!user[0]?.passwordHash || !(await verifyPassword(input.password, user[0].passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect email or password." });
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user[0].id));
      const token = await createCredentialSession(user[0].id);
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: LOCAL_SESSION_MAX_AGE_MS });
      return publicUser(user[0]);
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  restaurant: router({
    list: protectedProcedure.query(async ({ ctx }) => (await database()).select().from(restaurants).where(eq(restaurants.ownerId, ctx.user.id)).orderBy(asc(restaurants.createdAt))),
    get: protectedProcedure.input(idInput).query(async ({ ctx, input }) => owned(ctx.user.id, input.id)),
    create: protectedProcedure.input(restaurantInput).mutation(async ({ ctx, input }) => {
      const db = await database();
      const existing = await db.select({ id: restaurants.id }).from(restaurants).where(eq(restaurants.ownerId, ctx.user.id));
      if (existing.length >= planLimits.FREE) throw new TRPCError({ code: "FORBIDDEN", message: "The Free plan includes one restaurant. Upgrade your plan to add another." });
      const result = await db.insert(restaurants).values({ ownerId: ctx.user.id, name: input.name, slug: slugify(input.name), location: input.location, description: input.description || null, timezone: input.timezone, logoUrl: input.logoUrl || null, plan: "FREE" });
      const row = await db.select().from(restaurants).where(eq(restaurants.id, Number(result[0].insertId))).limit(1);
      return row[0];
    }),
    update: protectedProcedure.input(restaurantUpdateInput).mutation(async ({ ctx, input }) => {
      const db = await database(); await owned(ctx.user.id, input.id);
      await db.update(restaurants).set({ name: input.name, location: input.location, description: input.description || null, timezone: input.timezone, logoUrl: input.logoUrl || null }).where(eq(restaurants.id, input.id));
      return { success: true } as const;
    }),
    delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => { const db = await database(); await owned(ctx.user.id, input.id); await db.delete(restaurants).where(eq(restaurants.id, input.id)); return { success: true } as const; }),
  }),
  category: router({
    list: protectedProcedure.input(restaurantIdInput).query(async ({ ctx, input }) => { await owned(ctx.user.id, input.restaurantId); return (await database()).select().from(menuCategories).where(eq(menuCategories.restaurantId, input.restaurantId)).orderBy(asc(menuCategories.sortOrder)); }),
    create: protectedProcedure.input(categoryInput).mutation(async ({ ctx, input }) => {
      const db = await database(); await owned(ctx.user.id, input.restaurantId);
      const existing = await db.select({ id: menuCategories.id }).from(menuCategories).where(eq(menuCategories.restaurantId, input.restaurantId));
      const result = await db.insert(menuCategories).values({ restaurantId: input.restaurantId, name: input.name, description: input.description || null, sortOrder: existing.length });
      const row = await db.select().from(menuCategories).where(eq(menuCategories.id, Number(result[0].insertId))).limit(1);
      return row[0];
    }),
    update: protectedProcedure.input(categoryUpdateInput).mutation(async ({ ctx, input }) => {
      const db = await database(); const current = await db.select().from(menuCategories).where(eq(menuCategories.id, input.id)).limit(1);
      if (!current[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Category not found." }); await owned(ctx.user.id, current[0].restaurantId);
      await db.update(menuCategories).set({ name: input.name, description: input.description || null }).where(eq(menuCategories.id, input.id)); return { success: true } as const;
    }),
    delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
      const db = await database(); const current = await db.select().from(menuCategories).where(eq(menuCategories.id, input.id)).limit(1);
      if (!current[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Category not found." }); await owned(ctx.user.id, current[0].restaurantId);
      await db.delete(menuCategories).where(eq(menuCategories.id, input.id)); return { success: true } as const;
    }),
  }),
  menu: router({
    list: protectedProcedure.input(restaurantIdInput).query(async ({ ctx, input }) => { await owned(ctx.user.id, input.restaurantId); const rows = await (await database()).select().from(menuItems).where(eq(menuItems.restaurantId, input.restaurantId)).orderBy(asc(menuItems.sortOrder)); return rows.map(row => ({ ...row, price: Number(row.price) })); }),
    create: protectedProcedure.input(menuItemInput).mutation(async ({ ctx, input }) => {
      const db = await database(); await owned(ctx.user.id, input.restaurantId);
      const category = await db.select().from(menuCategories).where(and(eq(menuCategories.id, input.categoryId), eq(menuCategories.restaurantId, input.restaurantId))).limit(1);
      if (!category[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a category belonging to this restaurant." });
      const order = await db.select({ id: menuItems.id }).from(menuItems).where(eq(menuItems.categoryId, input.categoryId));
      const result = await db.insert(menuItems).values({ restaurantId: input.restaurantId, categoryId: input.categoryId, name: input.name, description: input.description || null, price: input.price.toFixed(2), imageUrl: input.imageUrl || null, isAvailable: input.isAvailable, sortOrder: order.length });
      const row = await db.select().from(menuItems).where(eq(menuItems.id, Number(result[0].insertId))).limit(1); return row[0] ? { ...row[0], price: Number(row[0].price) } : null;
    }),
    update: protectedProcedure.input(menuItemUpdateInput).mutation(async ({ ctx, input }) => {
      const db = await database(); const current = await db.select().from(menuItems).where(eq(menuItems.id, input.id)).limit(1);
      if (!current[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Menu item not found." }); await owned(ctx.user.id, current[0].restaurantId);
      if (input.categoryId !== undefined) {
        const category = await db.select().from(menuCategories).where(and(eq(menuCategories.id, input.categoryId), eq(menuCategories.restaurantId, current[0].restaurantId))).limit(1);
        if (!category[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a category belonging to this restaurant." });
      }
      await db.update(menuItems).set({ ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}), ...(input.name !== undefined ? { name: input.name } : {}), ...(input.description !== undefined ? { description: input.description || null } : {}), ...(input.price !== undefined ? { price: input.price.toFixed(2) } : {}), ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl || null } : {}), ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}), version: current[0].version + 1 }).where(eq(menuItems.id, input.id));
      return { success: true } as const;
    }),
    delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => { const db = await database(); const current = await db.select().from(menuItems).where(eq(menuItems.id, input.id)).limit(1); if (!current[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Menu item not found." }); await owned(ctx.user.id, current[0].restaurantId); await db.delete(menuItems).where(eq(menuItems.id, input.id)); return { success: true } as const; }),
    uploadImage: protectedProcedure.input(imageUploadInput).mutation(async ({ ctx, input }) => {
      const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(input.dataUrl);
      if (!match || match[1] !== input.contentType) throw new TRPCError({ code: "BAD_REQUEST", message: "Please choose a valid JPG, PNG, or WebP image." });
      const bytes = Buffer.from(match[2], "base64"); if (bytes.byteLength > 5_000_000) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Image files must be 5 MB or smaller." });
      if (!isImageSignatureValid(bytes, input.contentType)) throw new TRPCError({ code: "BAD_REQUEST", message: "The image content does not match its declared file type." });
      const safeFilename = input.filename.replace(/\s+/g, "-").toLowerCase();
      try {
        return await storagePut(`qrserve/${ctx.user.id}/menu-images/${safeFilename}`, bytes, input.contentType);
      } catch (error) {
        if (error instanceof StorageConfigurationError) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Dish image uploads are not connected yet. Please finish the secure image-storage setup and try again." });
        }
        console.error("QRServe dish image upload failed", safeImageStorageFailure(error));
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "We could not upload that image. Please try again." });
      }
    }),
  }),
  public: router({
    menu: publicProcedure.input(z.object({ slug: z.string().trim().min(1).max(120) })).query(async ({ input, ctx }) => {
      const db = await database(); const restaurant = await db.select().from(restaurants).where(eq(restaurants.slug, input.slug)).limit(1);
      if (!restaurant[0]) throw new TRPCError({ code: "NOT_FOUND", message: "This menu is no longer available." });
      const categories = await db.select().from(menuCategories).where(eq(menuCategories.restaurantId, restaurant[0].id)).orderBy(asc(menuCategories.sortOrder));
      const items = await db.select().from(menuItems).where(and(eq(menuItems.restaurantId, restaurant[0].id), eq(menuItems.isAvailable, true))).orderBy(asc(menuItems.sortOrder));
      const userAgent = Array.isArray(ctx.req.headers["user-agent"]) ? ctx.req.headers["user-agent"][0] : ctx.req.headers["user-agent"];
      await db.insert(analyticsEvents).values({ restaurantId: restaurant[0].id, eventType: "MENU_VIEW", userAgent: userAgent?.slice(0, 500) ?? null });
      return {
        restaurant: {
          name: restaurant[0].name,
          slug: restaurant[0].slug,
          location: restaurant[0].location,
          description: restaurant[0].description,
          logoUrl: restaurant[0].logoUrl,
        },
        categories: categories.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          items: items.filter(item => item.categoryId === category.id).map(item => ({
            id: item.id,
            categoryId: item.categoryId,
            name: item.name,
            description: item.description,
            price: Number(item.price),
            imageUrl: item.imageUrl,
          })),
        })),
      };
    }),
    trackScan: publicProcedure.input(z.object({ slug: z.string().trim().min(1).max(120) })).mutation(async ({ input }) => {
      const db = await database();
      const restaurant = await db.select({ id: restaurants.id }).from(restaurants).where(eq(restaurants.slug, input.slug)).limit(1);
      if (!restaurant[0]) throw new TRPCError({ code: "NOT_FOUND", message: "This menu is no longer available." });
      await db.insert(analyticsEvents).values({ restaurantId: restaurant[0].id, eventType: "QR_SCAN" });
      return { success: true } as const;
    }),
  }),
  analytics: router({
    summary: protectedProcedure.input(restaurantIdInput).query(async ({ ctx, input }) => {
      const db = await database(); await owned(ctx.user.id, input.restaurantId);
      const [views, scans, items, categories] = await Promise.all([
        db.select({ total: count() }).from(analyticsEvents).where(and(eq(analyticsEvents.restaurantId, input.restaurantId), eq(analyticsEvents.eventType, "MENU_VIEW"))),
        db.select({ total: count() }).from(analyticsEvents).where(and(eq(analyticsEvents.restaurantId, input.restaurantId), eq(analyticsEvents.eventType, "QR_SCAN"))),
        db.select({ total: count() }).from(menuItems).where(eq(menuItems.restaurantId, input.restaurantId)),
        db.select({ total: count() }).from(menuCategories).where(eq(menuCategories.restaurantId, input.restaurantId)),
      ]);
      return { views: Number(views[0]?.total ?? 0), scans: Number(scans[0]?.total ?? 0), items: Number(items[0]?.total ?? 0), categories: Number(categories[0]?.total ?? 0) };
    }),
  }),
});

export type AppRouter = typeof appRouter;
