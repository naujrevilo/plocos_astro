-- Migration: replace approved (int 0/1) with status (text enum), add rejectionReason and notifyAuthor.
-- Preserves existing data: approved=1 becomes status='approved', approved=0 stays pending (the new column default).
-- DROP COLUMN requires SQLite 3.35+/libsql.

ALTER TABLE `Comments` ADD `status` text DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
UPDATE `Comments` SET `status` = 'approved' WHERE `approved` = 1;
--> statement-breakpoint
ALTER TABLE `Comments` DROP COLUMN `approved`;
--> statement-breakpoint
ALTER TABLE `Comments` ADD `rejectionReason` text;
--> statement-breakpoint
ALTER TABLE `Comments` ADD `notifyAuthor` integer DEFAULT 0 NOT NULL;
