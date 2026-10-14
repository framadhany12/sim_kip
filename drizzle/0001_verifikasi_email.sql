CREATE TABLE `email_verifications` (
	`id` varchar(64) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `email_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified_at` datetime(3);--> statement-breakpoint
ALTER TABLE `email_verifications` ADD CONSTRAINT `email_verifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Akun yang sudah ada sebelum fitur verifikasi dianggap terverifikasi agar tidak terkunci.
UPDATE `users` SET `email_verified_at` = `created_at` WHERE `email_verified_at` IS NULL;