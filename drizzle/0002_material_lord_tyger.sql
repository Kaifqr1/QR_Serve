CREATE TABLE `owner_activity_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`restaurantId` int,
	`eventType` varchar(64) NOT NULL,
	`summary` varchar(280) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `owner_activity_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `owner_activity_owner_idx` ON `owner_activity_events` (`ownerId`);--> statement-breakpoint
CREATE INDEX `owner_activity_restaurant_idx` ON `owner_activity_events` (`restaurantId`);--> statement-breakpoint
CREATE INDEX `owner_activity_created_idx` ON `owner_activity_events` (`createdAt`);
