CREATE TABLE `buku_tabungan` (
	`id` varchar(36) NOT NULL,
	`pendaftaran_id` varchar(36) NOT NULL,
	`no_rekening` varchar(30) NOT NULL,
	`file_url` varchar(255) NOT NULL,
	`nama_asli` varchar(200) NOT NULL,
	`mime_type` varchar(50) NOT NULL,
	`ukuran` int NOT NULL,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `buku_tabungan_id` PRIMARY KEY(`id`),
	CONSTRAINT `buku_tabungan_pendaftaran` UNIQUE(`pendaftaran_id`)
);
--> statement-breakpoint
ALTER TABLE `pengumuman_mahasiswa` ADD `jenis` varchar(20);--> statement-breakpoint
ALTER TABLE `buku_tabungan` ADD CONSTRAINT `buku_tabungan_pendaftaran_id_pendaftaran_id_fk` FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON DELETE cascade ON UPDATE no action;