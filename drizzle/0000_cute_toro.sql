CREATE TABLE `Comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`postSlug` text NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`message` text NOT NULL,
	`createdAt` integer NOT NULL,
	`approved` integer DEFAULT 0 NOT NULL
);
