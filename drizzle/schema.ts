import { boolean, decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, table => [uniqueIndex("users_email_unique").on(table.email)]);

export const restaurants = mysqlTable("restaurants", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("restaurants_slug_unique").on(table.slug), index("restaurants_owner_idx").on(table.ownerId)]);

export const menuCategories = mysqlTable("menuCategories", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 48 }).notNull(),
  description: varchar("description", { length: 160 }),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("categories_restaurant_idx").on(table.restaurantId)]);

export const menuItems = mysqlTable("menuItems", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("items_restaurant_idx").on(table.restaurantId), index("items_category_idx").on(table.categoryId)]);

export const analyticsEvents = mysqlTable("analyticsEvents", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  menuItemId: int("menuItemId").references(() => menuItems.id, { onDelete: "set null" }),
  eventType: mysqlEnum("eventType", ["MENU_VIEW", "QR_SCAN", "ITEM_VIEW"]).notNull(),
  userAgent: varchar("userAgent", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("analytics_restaurant_idx").on(table.restaurantId), index("analytics_created_idx").on(table.createdAt)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
