CREATE INDEX `pendaftaran_submitted` ON `pendaftaran` (`submitted_at`);--> statement-breakpoint
CREATE INDEX `riwayat_created` ON `riwayat_status` (`created_at`);--> statement-breakpoint
CREATE INDEX `users_role_created` ON `users` (`role`,`created_at`);