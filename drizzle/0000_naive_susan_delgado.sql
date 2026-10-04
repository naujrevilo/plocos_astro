CREATE TABLE `auditorProfiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`publicVisible` integer DEFAULT false NOT NULL,
	`bio` text,
	`photoUrl` text,
	`ascentionCount` integer DEFAULT 0 NOT NULL,
	`lastAscentionYear` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`clerkUserId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auditorProfiles_userId_unique` ON `auditorProfiles` (`userId`);--> statement-breakpoint
CREATE TABLE `bookAnnotations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`paragraphId` integer NOT NULL,
	`userId` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`triajeLevel` integer,
	`triajeReasoning` text,
	`approvedAt` integer,
	`approvalReason` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`paragraphId`) REFERENCES `bookParagraphs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`clerkUserId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bookChapters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`iterationId` integer NOT NULL,
	`chapterNum` integer NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`iterationId`) REFERENCES `iterations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bookParagraphs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chapterId` integer NOT NULL,
	`paragraphNum` integer NOT NULL,
	`anchorId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`chapterId`) REFERENCES `bookChapters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `iterations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`cycleNum` integer NOT NULL,
	`startsAt` integer NOT NULL,
	`endsAt` integer NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`pdfUrl` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `iterations_year_cycleNum_unique` ON `iterations` (`year`,`cycleNum`);--> statement-breakpoint
CREATE TABLE `notificationQueue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text,
	`emailType` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`scheduledFor` integer NOT NULL,
	`sentAt` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`clerkUserId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`provider` text NOT NULL,
	`providerSubscriptionId` text NOT NULL,
	`plan` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`currentPeriodStart` integer,
	`currentPeriodEnd` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`clerkUserId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`clerkUserId` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`displayName` text,
	`role` text,
	`habeasScriptumAcceptedAt` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
