ALTER TABLE `pendaftaran` ADD `angkatan` int;--> statement-breakpoint
ALTER TABLE `users` ADD `mahasiswa_lama` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `wajib_ganti_sandi` boolean DEFAULT false NOT NULL;