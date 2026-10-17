ALTER TABLE `pendaftaran` ADD `nim` varchar(30);--> statement-breakpoint
ALTER TABLE `pendaftaran` ADD `kelas` varchar(30);--> statement-breakpoint
ALTER TABLE `pendaftaran` ADD CONSTRAINT `pendaftaran_nim` UNIQUE(`nim`);