-- Run this once in the TiDB SQL Editor after selecting the qrserve database.
CREATE TABLE `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `openId` varchar(64) NOT NULL,
  `name` text,
  `email` varchar(320),
  `loginMethod` varchar(64),
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `users_id` PRIMARY KEY(`id`),
  CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);

CREATE TABLE `restaurants` (
  `id` int AUTO_INCREMENT NOT NULL,
  `ownerId` int NOT NULL,
  `name` varchar(80) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `location` varchar(120) NOT NULL,
  `description` text,
  `timezone` varchar(80) NOT NULL DEFAULT 'Asia/Kolkata',
  `logoUrl` text,
  `plan` enum('FREE','STARTER','PRO') NOT NULL DEFAULT 'FREE',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `restaurants_id` PRIMARY KEY(`id`),
  CONSTRAINT `restaurants_slug_unique` UNIQUE(`slug`),
  CONSTRAINT `restaurants_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade
);

CREATE TABLE `menuCategories` (
  `id` int AUTO_INCREMENT NOT NULL,
  `restaurantId` int NOT NULL,
  `name` varchar(48) NOT NULL,
  `description` varchar(160),
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `menuCategories_id` PRIMARY KEY(`id`),
  CONSTRAINT `menuCategories_restaurantId_restaurants_id_fk` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants`(`id`) ON DELETE cascade
);

CREATE TABLE `menuItems` (
  `id` int AUTO_INCREMENT NOT NULL,
  `categoryId` int NOT NULL,
  `restaurantId` int NOT NULL,
  `name` varchar(80) NOT NULL,
  `description` varchar(280),
  `price` decimal(10,2) NOT NULL,
  `imageUrl` text,
  `sortOrder` int NOT NULL DEFAULT 0,
  `isAvailable` boolean NOT NULL DEFAULT true,
  `version` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `menuItems_id` PRIMARY KEY(`id`),
  CONSTRAINT `menuItems_categoryId_menuCategories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `menuCategories`(`id`) ON DELETE cascade,
  CONSTRAINT `menuItems_restaurantId_restaurants_id_fk` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants`(`id`) ON DELETE cascade
);

CREATE TABLE `analyticsEvents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `restaurantId` int NOT NULL,
  `menuItemId` int,
  `eventType` enum('MENU_VIEW','QR_SCAN','ITEM_VIEW') NOT NULL,
  `userAgent` varchar(500),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `analyticsEvents_id` PRIMARY KEY(`id`),
  CONSTRAINT `analyticsEvents_restaurantId_restaurants_id_fk` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants`(`id`) ON DELETE cascade,
  CONSTRAINT `analyticsEvents_menuItemId_menuItems_id_fk` FOREIGN KEY (`menuItemId`) REFERENCES `menuItems`(`id`) ON DELETE set null
);

CREATE INDEX `analytics_restaurant_idx` ON `analyticsEvents` (`restaurantId`);
CREATE INDEX `analytics_created_idx` ON `analyticsEvents` (`createdAt`);
CREATE INDEX `categories_restaurant_idx` ON `menuCategories` (`restaurantId`);
CREATE INDEX `items_restaurant_idx` ON `menuItems` (`restaurantId`);
CREATE INDEX `items_category_idx` ON `menuItems` (`categoryId`);
CREATE INDEX `restaurants_owner_idx` ON `restaurants` (`ownerId`);
