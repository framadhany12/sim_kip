CREATE TABLE `pengumuman_mahasiswa` (
	`id` varchar(36) NOT NULL,
	`judul` varchar(150) NOT NULL,
	`isi` text NOT NULL,
	`semester` int,
	`tenggat` varchar(10),
	`aktif` boolean NOT NULL DEFAULT true,
	`dibuat_oleh` varchar(36),
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `pengumuman_mahasiswa_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `pengumuman_mahasiswa` ADD CONSTRAINT `pengumuman_mahasiswa_dibuat_oleh_users_id_fk` FOREIGN KEY (`dibuat_oleh`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;