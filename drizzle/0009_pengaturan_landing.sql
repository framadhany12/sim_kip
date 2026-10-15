CREATE TABLE `pengaturan` (
	`kunci` varchar(64) NOT NULL,
	`nilai` longtext NOT NULL,
	`diubah_oleh` varchar(36),
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `pengaturan_kunci` PRIMARY KEY(`kunci`)
);
--> statement-breakpoint
ALTER TABLE `pengaturan` ADD CONSTRAINT `pengaturan_diubah_oleh_users_id_fk` FOREIGN KEY (`diubah_oleh`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;