CREATE TABLE `jenis_beasiswa` (
	`id` varchar(36) NOT NULL,
	`nama` varchar(100) NOT NULL,
	`aktif` boolean NOT NULL DEFAULT true,
	`urutan` int NOT NULL DEFAULT 0,
	CONSTRAINT `jenis_beasiswa_id` PRIMARY KEY(`id`),
	CONSTRAINT `jenis_beasiswa_nama_unique` UNIQUE(`nama`)
);
--> statement-breakpoint
ALTER TABLE `pendaftaran` ADD `jenis_beasiswa_id` varchar(36);--> statement-breakpoint
ALTER TABLE `pendaftaran` ADD CONSTRAINT `pendaftaran_jenis_beasiswa_id_jenis_beasiswa_id_fk` FOREIGN KEY (`jenis_beasiswa_id`) REFERENCES `jenis_beasiswa`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
INSERT INTO `jenis_beasiswa` (`id`, `nama`, `aktif`, `urutan`) VALUES (UUID(), 'LLDIKTI', 1, 1);
