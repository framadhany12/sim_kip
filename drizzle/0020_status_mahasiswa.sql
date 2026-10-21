ALTER TABLE `pendaftaran` ADD `status_mahasiswa` enum('aktif','dicabut','tidak_aktif','lulus') DEFAULT 'aktif' NOT NULL;--> statement-breakpoint
ALTER TABLE `pendaftaran` ADD `status_mahasiswa_tanggal` varchar(10);--> statement-breakpoint
ALTER TABLE `pendaftaran` ADD `status_mahasiswa_keterangan` varchar(255);