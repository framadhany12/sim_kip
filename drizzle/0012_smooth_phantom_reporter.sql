ALTER TABLE `pendaftaran` ADD `wawancara_selesai` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `pendaftaran` ADD `usulan` enum('menunggu','bersedia','tidak');--> statement-breakpoint
ALTER TABLE `pendaftaran` ADD `alasan_tidak_bersedia` text;