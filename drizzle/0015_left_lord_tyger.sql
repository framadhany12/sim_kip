CREATE TABLE `laporan_akademik` (
	`id` varchar(36) NOT NULL,
	`pendaftaran_id` varchar(36) NOT NULL,
	`semester` int NOT NULL,
	`ipk` decimal(3,2) NOT NULL,
	`file_url` varchar(255) NOT NULL,
	`nama_asli` varchar(200) NOT NULL,
	`mime_type` varchar(50) NOT NULL,
	`ukuran` int NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `laporan_akademik_id` PRIMARY KEY(`id`),
	CONSTRAINT `laporan_pendaftaran_semester` UNIQUE(`pendaftaran_id`,`semester`)
);
--> statement-breakpoint
ALTER TABLE `laporan_akademik` ADD CONSTRAINT `laporan_akademik_pendaftaran_id_pendaftaran_id_fk` FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON DELETE cascade ON UPDATE no action;