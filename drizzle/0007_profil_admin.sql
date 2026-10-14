CREATE TABLE `profil_admin` (
	`user_id` varchar(36) NOT NULL,
	`jabatan` varchar(100),
	`whatsapp` varchar(20),
	`keterangan` varchar(300),
	`tampil` boolean NOT NULL DEFAULT false,
	CONSTRAINT `profil_admin_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `profil_admin` ADD CONSTRAINT `profil_admin_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;