CREATE TABLE `kegiatan` (
	`id` varchar(36) NOT NULL,
	`nama` varchar(150) NOT NULL,
	`deskripsi` text,
	`lokasi` varchar(150),
	`mulai` datetime(3) NOT NULL,
	`selesai` datetime(3) NOT NULL,
	`rahasia` varchar(64) NOT NULL,
	`dibuat_oleh` varchar(36),
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `kegiatan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `presensi_kegiatan` (
	`id` varchar(36) NOT NULL,
	`kegiatan_id` varchar(36) NOT NULL,
	`pendaftaran_id` varchar(36) NOT NULL,
	`waktu` datetime(3) NOT NULL,
	CONSTRAINT `presensi_kegiatan_id` PRIMARY KEY(`id`),
	CONSTRAINT `presensi_kegiatan_mahasiswa` UNIQUE(`kegiatan_id`,`pendaftaran_id`)
);
--> statement-breakpoint
ALTER TABLE `kegiatan` ADD CONSTRAINT `kegiatan_dibuat_oleh_users_id_fk` FOREIGN KEY (`dibuat_oleh`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `presensi_kegiatan` ADD CONSTRAINT `presensi_kegiatan_kegiatan_id_kegiatan_id_fk` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `presensi_kegiatan` ADD CONSTRAINT `presensi_kegiatan_pendaftaran_id_pendaftaran_id_fk` FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON DELETE cascade ON UPDATE no action;