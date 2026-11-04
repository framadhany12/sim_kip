CREATE TABLE `kode_pemulihan` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`hash` varchar(64) NOT NULL,
	CONSTRAINT `kode_pemulihan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `totp_secret` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `totp_aktif` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totp_langkah` int;--> statement-breakpoint
ALTER TABLE `kode_pemulihan` ADD CONSTRAINT `kode_pemulihan_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `kode_pemulihan_user` ON `kode_pemulihan` (`user_id`);--> statement-breakpoint
DELETE `s` FROM `sessions` `s` INNER JOIN `users` `u` ON `u`.`id` = `s`.`user_id` WHERE `u`.`role` = 'admin';
