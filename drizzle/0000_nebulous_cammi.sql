CREATE TABLE IF NOT EXISTS `hex_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`q` integer NOT NULL,
	`r` integer NOT NULL,
	`owner_id` text NOT NULL,
	`building_type` text DEFAULT 'igloo' NOT NULL,
	`colorway` text DEFAULT 'ice' NOT NULL,
	`label` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`handle` text NOT NULL,
	`display_name` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
