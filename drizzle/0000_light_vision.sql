CREATE TABLE `activity_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload_json` text NOT NULL,
	`sequence` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_activity_events_session_sequence` ON `activity_events` (`session_id`,`sequence`);--> statement-breakpoint
CREATE TABLE `activity_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`activity_key` text NOT NULL,
	`room_code` text NOT NULL,
	`status` text NOT NULL,
	`state_json` text NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_activity_room` ON `activity_sessions` (`room_code`);--> statement-breakpoint
CREATE INDEX `idx_activity_space` ON `activity_sessions` (`space_id`);--> statement-breakpoint
CREATE TABLE `couple_spaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `future_letters` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`author_id` text NOT NULL,
	`body` text NOT NULL,
	`opens_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_letters_space_open` ON `future_letters` (`space_id`,`opens_at`);--> statement-breakpoint
CREATE TABLE `invites` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`code` text NOT NULL,
	`token` text NOT NULL,
	`created_by` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`used_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_invites_code` ON `invites` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_invites_token` ON `invites` (`token`);--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`moment_id` text,
	`owner_id` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_media_space` ON `media_assets` (`space_id`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`joined_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_memberships_space_user` ON `memberships` (`space_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_memberships_user` ON `memberships` (`user_id`);--> statement-breakpoint
CREATE TABLE `moments` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`author_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`note` text NOT NULL,
	`happened_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_moments_space_date` ON `moments` (`space_id`,`happened_at`);--> statement-breakpoint
CREATE TABLE `reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`moment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`emoji` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reactions_moment_user` ON `reactions` (`moment_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `ritual_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`ritual_key` text NOT NULL,
	`user_id` text NOT NULL,
	`answer` text NOT NULL,
	`completed_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_ritual_space_key_user` ON `ritual_responses` (`space_id`,`ritual_key`,`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);