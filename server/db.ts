import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, restaurants, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let database: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!database && process.env.DATABASE_URL) database = drizzle(process.env.DATABASE_URL);
  return database;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    lastSignedIn: user.lastSignedIn ?? new Date(),
    role: user.openId === ENV.ownerOpenId ? "admin" : user.role ?? "user",
  };
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: { name: values.name, email: values.email, loginMethod: values.loginMethod, lastSignedIn: values.lastSignedIn, role: values.role } });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getOwnedRestaurant(ownerId: number, restaurantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(restaurants).where(and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, ownerId))).limit(1);
  return result[0];
}
