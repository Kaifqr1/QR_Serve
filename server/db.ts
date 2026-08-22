import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool, type PoolOptions } from "mysql2/promise";
import { restaurants, users } from "../drizzle/schema";

export function createDatabasePoolOptions(connectionString: string): PoolOptions {
  const url = new URL(connectionString);
  if (url.protocol !== "mysql:") throw new Error("DATABASE_URL must use the mysql protocol");
  const databaseName = url.pathname.replace(/^\//, "");
  if (!databaseName) throw new Error("DATABASE_URL must include a database name");
  const isTiDbPublicEndpoint = url.hostname.endsWith(".tidbcloud.com");

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: databaseName,
    connectionLimit: 1,
    maxIdle: 1,
    enableKeepAlive: true,
    ...(isTiDbPublicEndpoint
      ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } }
      : {}),
  };
}

function createDatabaseClient(connectionString: string) {
  return drizzle({ client: createPool(createDatabasePoolOptions(connectionString)) });
}

let database: ReturnType<typeof createDatabaseClient> | null = null;

export async function getDb() {
  if (!database && process.env.DATABASE_URL) {
    database = createDatabaseClient(process.env.DATABASE_URL);
  }
  return database;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function getOwnedRestaurant(ownerId: number, restaurantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(restaurants).where(and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, ownerId))).limit(1);
  return result[0];
}
