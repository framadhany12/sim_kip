CREATE INDEX `data_diri_nik` ON `data_diri` (`nik`);--> statement-breakpoint
CREATE INDEX `pendaftaran_status_tahap` ON `pendaftaran` (`status`,`tahap`);--> statement-breakpoint
CREATE INDEX `pendaftaran_hasil_mhs` ON `pendaftaran` (`hasil`,`status_mahasiswa`);