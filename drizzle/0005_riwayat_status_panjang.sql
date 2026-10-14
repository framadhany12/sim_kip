ALTER TABLE `riwayat_status` MODIFY COLUMN `status` varchar(40) NOT NULL;--> statement-breakpoint
-- Perbaiki label riwayat yang sempat terpotong karena kolom terlalu pendek.
UPDATE `riwayat_status` SET `status` = 'tidak_lolos:administrasi' WHERE `status` = 'tidak_lolos:administ';