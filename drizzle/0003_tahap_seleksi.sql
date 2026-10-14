ALTER TABLE `pendaftaran` ADD `tahap` enum('administrasi','ujian','wawancara','pengusulan','pengumuman');--> statement-breakpoint
ALTER TABLE `pendaftaran` ADD `hasil` enum('diterima','ditolak');--> statement-breakpoint
ALTER TABLE `pendaftaran` ADD `jurusan_diterima_id` varchar(36);--> statement-breakpoint
ALTER TABLE `pendaftaran` ADD CONSTRAINT `pendaftaran_jurusan_diterima_id_jurusan_id_fk` FOREIGN KEY (`jurusan_diterima_id`) REFERENCES `jurusan`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
UPDATE `pendaftaran` SET `tahap` = 'administrasi' WHERE `status` IN ('terkirim','diperiksa','perbaikan') AND `tahap` IS NULL;--> statement-breakpoint
UPDATE `pendaftaran` SET `tahap` = 'pengumuman', `hasil` = `status` WHERE `status` IN ('diterima','ditolak') AND `tahap` IS NULL;