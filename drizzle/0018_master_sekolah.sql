CREATE TABLE `sekolah` (
	`id` varchar(36) NOT NULL,
	`npsn` varchar(8) NOT NULL,
	`nama` varchar(150) NOT NULL,
	`kota` varchar(100),
	`sumber` enum('admin','pendaftar') NOT NULL DEFAULT 'admin',
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `sekolah_id` PRIMARY KEY(`id`),
	CONSTRAINT `sekolah_npsn_unique` UNIQUE(`npsn`)
);
--> statement-breakpoint
CREATE INDEX `sekolah_nama` ON `sekolah` (`nama`);--> statement-breakpoint
-- Isi awal dari sekolah yang sudah pernah diisi pendaftar (satu baris per NPSN yang valid).
INSERT INTO `sekolah` (`id`, `npsn`, `nama`, `sumber`, `created_at`)
SELECT UUID(), `npsn`, MIN(`nama_sekolah`), 'pendaftar', NOW(3) FROM `data_sekolah` WHERE `npsn` REGEXP '^[0-9]{8}$' GROUP BY `npsn`;
