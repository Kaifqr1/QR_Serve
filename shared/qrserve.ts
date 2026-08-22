import { z } from "zod";

export const planValues = ["FREE", "STARTER", "PRO"] as const;
export type Plan = (typeof planValues)[number];

export const planLimits: Record<Plan, number> = {
  FREE: 1,
  STARTER: 3,
  PRO: Number.POSITIVE_INFINITY,
};

export const restaurantInput = z.object({
  name: z.string().trim().min(2, "Restaurant name must be at least 2 characters.").max(80),
  location: z.string().trim().min(2, "Location is required.").max(120),
  description: z.string().trim().max(320).optional().default(""),
  timezone: z.string().trim().max(80).optional().default("Asia/Kolkata"),
  logoUrl: z.string().url().optional().or(z.literal("")).default(""),
});

export const restaurantUpdateInput = restaurantInput.extend({
  id: z.number().int().positive(),
});

export const categoryInput = z.object({
  restaurantId: z.number().int().positive(),
  name: z.string().trim().min(2, "Category name must be at least 2 characters.").max(48),
  description: z.string().trim().max(160).optional().default(""),
});

export const categoryUpdateInput = categoryInput.pick({ name: true, description: true }).extend({
  id: z.number().int().positive(),
});

export const menuItemInput = z.object({
  restaurantId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  name: z.string().trim().min(2, "Menu item name must be at least 2 characters.").max(80),
  description: z.string().trim().max(280).optional().default(""),
  price: z.coerce.number().min(0, "Price cannot be negative.").max(999999),
  imageUrl: z.string().url().optional().or(z.literal("")).default(""),
  isAvailable: z.boolean().default(true),
});

export const menuItemUpdateInput = menuItemInput.partial().extend({
  id: z.number().int().positive(),
});

export const imageUploadInput = z.object({
  filename: z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9._ -]+$/, "Use a simple image filename."),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  dataUrl: z.string().min(50).max(7_000_000),
});
