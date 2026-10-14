CREATE TABLE `rekomendasi` (
	`id` varchar(36) NOT NULL,
	`pendaftaran_id` varchar(36) NOT NULL,
	`sumber_id` varchar(36) NOT NULL,
	`nama_perekomendasi` varchar(150),
	`telepon_perekomendasi` varchar(20),
	CONSTRAINT `rekomendasi_id` PRIMARY KEY(`id`),
	CONSTRAINT `rekomendasi_pendaftaran_id_unique` UNIQUE(`pendaftaran_id`)
);
--> statement-breakpoint
CREATE TABLE `sumber_rekomendasi` (
	`id` varchar(36) NOT NULL,
	`nama` varchar(60) NOT NULL,
	`butuh_kontak` boolean NOT NULL DEFAULT true,
	`aktif` boolean NOT NULL DEFAULT true,
	`urutan` int NOT NULL DEFAULT 0,
	CONSTRAINT `sumber_rekomendasi_id` PRIMARY KEY(`id`),
	CONSTRAINT `sumber_rekomendasi_nama_unique` UNIQUE(`nama`)
);
--> statement-breakpoint
ALTER TABLE `data_diri` ADD `nomor_pendaftaran_kip` varchar(30);--> statement-breakpoint
ALTER TABLE `data_diri` ADD `nisn` varchar(10);--> statement-breakpoint
ALTER TABLE `data_diri` ADD `desil` enum('1','2','3','4','5','6-10');--> statement-breakpoint
ALTER TABLE `data_diri` ADD `penerima_pip` boolean;--> statement-breakpoint
ALTER TABLE `data_diri` ADD `agama` enum('Islam','Kristen Protestan','Katolik','Hindu','Buddha','Khonghucu','Kepercayaan terhadap Tuhan YME');--> statement-breakpoint
ALTER TABLE `data_diri` ADD `status_pernikahan` enum('belum_menikah','menikah');--> statement-breakpoint
ALTER TABLE `data_keluarga` ADD `telepon_orang_tua` varchar(20);--> statement-breakpoint
ALTER TABLE `rekomendasi` ADD CONSTRAINT `rekomendasi_pendaftaran_id_pendaftaran_id_fk` FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rekomendasi` ADD CONSTRAINT `rekomendasi_sumber_id_sumber_rekomendasi_id_fk` FOREIGN KEY (`sumber_id`) REFERENCES `sumber_rekomendasi`(`id`) ON DELETE no action ON UPDATE no action;