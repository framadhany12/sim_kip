CREATE TABLE `berkas` (
	`id` varchar(36) NOT NULL,
	`pendaftaran_id` varchar(36) NOT NULL,
	`jenis` enum('ijazah','akta_kelahiran','kk','ktp','surat_permohonan_direktur','surat_ekonomi') NOT NULL,
	`file_url` varchar(255) NOT NULL,
	`nama_asli` varchar(200) NOT NULL,
	`mime_type` varchar(50) NOT NULL,
	`ukuran` int NOT NULL,
	`status_verifikasi` enum('menunggu','valid','tidak_valid') NOT NULL DEFAULT 'menunggu',
	`uploaded_at` datetime(3) NOT NULL,
	CONSTRAINT `berkas_id` PRIMARY KEY(`id`),
	CONSTRAINT `berkas_pendaftaran_jenis` UNIQUE(`pendaftaran_id`,`jenis`)
);
--> statement-breakpoint
CREATE TABLE `data_diri` (
	`id` varchar(36) NOT NULL,
	`pendaftaran_id` varchar(36) NOT NULL,
	`nik` varchar(16) NOT NULL,
	`nama_lengkap` varchar(150) NOT NULL,
	`tempat_lahir` varchar(100) NOT NULL,
	`tanggal_lahir` varchar(10) NOT NULL,
	`jenis_kelamin` enum('L','P') NOT NULL,
	`alamat_lengkap` text NOT NULL,
	`rt` varchar(3) NOT NULL,
	`rw` varchar(3) NOT NULL,
	`desa_kelurahan` varchar(100) NOT NULL,
	`kecamatan_id` varchar(10) NOT NULL,
	`kabupaten_id` varchar(10) NOT NULL,
	`kontak` varchar(20) NOT NULL,
	CONSTRAINT `data_diri_id` PRIMARY KEY(`id`),
	CONSTRAINT `data_diri_pendaftaran_id_unique` UNIQUE(`pendaftaran_id`)
);
--> statement-breakpoint
CREATE TABLE `data_keluarga` (
	`id` varchar(36) NOT NULL,
	`pendaftaran_id` varchar(36) NOT NULL,
	`nama_ayah` varchar(150) NOT NULL,
	`nama_ibu` varchar(150) NOT NULL,
	`nama_wali` varchar(150),
	`jumlah_anggota_keluarga` int NOT NULL,
	CONSTRAINT `data_keluarga_id` PRIMARY KEY(`id`),
	CONSTRAINT `data_keluarga_pendaftaran_id_unique` UNIQUE(`pendaftaran_id`)
);
--> statement-breakpoint
CREATE TABLE `data_sekolah` (
	`id` varchar(36) NOT NULL,
	`pendaftaran_id` varchar(36) NOT NULL,
	`nama_sekolah` varchar(150) NOT NULL,
	`npsn` varchar(8) NOT NULL,
	`tahun_lulus` int NOT NULL,
	`jurusan_sekolah` varchar(100) NOT NULL,
	CONSTRAINT `data_sekolah_id` PRIMARY KEY(`id`),
	CONSTRAINT `data_sekolah_pendaftaran_id_unique` UNIQUE(`pendaftaran_id`)
);
--> statement-breakpoint
CREATE TABLE `ekonomi_orangtua` (
	`id` varchar(36) NOT NULL,
	`pendaftaran_id` varchar(36) NOT NULL,
	`penghasilan_bulanan` decimal(15,2) NOT NULL,
	`pekerjaan` varchar(100) NOT NULL,
	`tanggungan` int NOT NULL,
	`keterangan_tambahan` text,
	`surat_kebutuhan_ekonomi_url` varchar(255),
	CONSTRAINT `ekonomi_orangtua_id` PRIMARY KEY(`id`),
	CONSTRAINT `ekonomi_orangtua_pendaftaran_id_unique` UNIQUE(`pendaftaran_id`)
);
--> statement-breakpoint
CREATE TABLE `faq` (
	`id` varchar(36) NOT NULL,
	`pertanyaan` text NOT NULL,
	`jawaban` text NOT NULL,
	`urutan` int NOT NULL DEFAULT 0,
	CONSTRAINT `faq_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jurusan` (
	`id` varchar(36) NOT NULL,
	`kode` varchar(20) NOT NULL,
	`nama` varchar(150) NOT NULL,
	`buka_pilihan_1` boolean NOT NULL DEFAULT true,
	`buka_pilihan_2` boolean NOT NULL DEFAULT true,
	`aktif` boolean NOT NULL DEFAULT true,
	CONSTRAINT `jurusan_id` PRIMARY KEY(`id`),
	CONSTRAINT `jurusan_kode_unique` UNIQUE(`kode`)
);
--> statement-breakpoint
CREATE TABLE `password_resets` (
	`id` varchar(64) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	CONSTRAINT `password_resets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pendaftaran` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`gelombang` varchar(100) NOT NULL,
	`status` enum('draft','terkirim','diperiksa','perbaikan','diterima','ditolak') NOT NULL DEFAULT 'draft',
	`catatan_admin` text,
	`submitted_at` datetime(3),
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `pendaftaran_id` PRIMARY KEY(`id`),
	CONSTRAINT `pendaftaran_user_gelombang` UNIQUE(`user_id`,`gelombang`)
);
--> statement-breakpoint
CREATE TABLE `pertanyaan` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`isi` text NOT NULL,
	`jawaban` text,
	`dijawab_oleh` varchar(36),
	`created_at` datetime(3) NOT NULL,
	`answered_at` datetime(3),
	CONSTRAINT `pertanyaan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pilihan_jurusan` (
	`id` varchar(36) NOT NULL,
	`pendaftaran_id` varchar(36) NOT NULL,
	`jurusan_1_id` varchar(36) NOT NULL,
	`jurusan_2_id` varchar(36) NOT NULL,
	CONSTRAINT `pilihan_jurusan_id` PRIMARY KEY(`id`),
	CONSTRAINT `pilihan_jurusan_pendaftaran_id_unique` UNIQUE(`pendaftaran_id`)
);
--> statement-breakpoint
CREATE TABLE `riwayat_status` (
	`id` varchar(36) NOT NULL,
	`pendaftaran_id` varchar(36) NOT NULL,
	`status` varchar(20) NOT NULL,
	`catatan` text,
	`diubah_oleh` varchar(36),
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `riwayat_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(64) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`nama` varchar(150) NOT NULL,
	`email` varchar(191) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('pendaftar','admin') NOT NULL DEFAULT 'pendaftar',
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `wilayah_kabupaten` (
	`id` varchar(10) NOT NULL,
	`kode` varchar(10) NOT NULL,
	`nama` varchar(100) NOT NULL,
	`provinsi` varchar(100) NOT NULL,
	CONSTRAINT `wilayah_kabupaten_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wilayah_kecamatan` (
	`id` varchar(10) NOT NULL,
	`kode` varchar(10) NOT NULL,
	`nama` varchar(100) NOT NULL,
	`kabupaten_id` varchar(10) NOT NULL,
	CONSTRAINT `wilayah_kecamatan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `berkas` ADD CONSTRAINT `berkas_pendaftaran_id_pendaftaran_id_fk` FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_diri` ADD CONSTRAINT `data_diri_pendaftaran_id_pendaftaran_id_fk` FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_diri` ADD CONSTRAINT `data_diri_kecamatan_id_wilayah_kecamatan_id_fk` FOREIGN KEY (`kecamatan_id`) REFERENCES `wilayah_kecamatan`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_diri` ADD CONSTRAINT `data_diri_kabupaten_id_wilayah_kabupaten_id_fk` FOREIGN KEY (`kabupaten_id`) REFERENCES `wilayah_kabupaten`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_keluarga` ADD CONSTRAINT `data_keluarga_pendaftaran_id_pendaftaran_id_fk` FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_sekolah` ADD CONSTRAINT `data_sekolah_pendaftaran_id_pendaftaran_id_fk` FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ekonomi_orangtua` ADD CONSTRAINT `ekonomi_orangtua_pendaftaran_id_pendaftaran_id_fk` FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_resets` ADD CONSTRAINT `password_resets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pendaftaran` ADD CONSTRAINT `pendaftaran_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pertanyaan` ADD CONSTRAINT `pertanyaan_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pertanyaan` ADD CONSTRAINT `pertanyaan_dijawab_oleh_users_id_fk` FOREIGN KEY (`dijawab_oleh`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pilihan_jurusan` ADD CONSTRAINT `pilihan_jurusan_pendaftaran_id_pendaftaran_id_fk` FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pilihan_jurusan` ADD CONSTRAINT `pilihan_jurusan_jurusan_1_id_jurusan_id_fk` FOREIGN KEY (`jurusan_1_id`) REFERENCES `jurusan`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pilihan_jurusan` ADD CONSTRAINT `pilihan_jurusan_jurusan_2_id_jurusan_id_fk` FOREIGN KEY (`jurusan_2_id`) REFERENCES `jurusan`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `riwayat_status` ADD CONSTRAINT `riwayat_status_pendaftaran_id_pendaftaran_id_fk` FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `riwayat_status` ADD CONSTRAINT `riwayat_status_diubah_oleh_users_id_fk` FOREIGN KEY (`diubah_oleh`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wilayah_kecamatan` ADD CONSTRAINT `wilayah_kecamatan_kabupaten_id_wilayah_kabupaten_id_fk` FOREIGN KEY (`kabupaten_id`) REFERENCES `wilayah_kabupaten`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `pendaftaran_status` ON `pendaftaran` (`status`);--> statement-breakpoint
CREATE INDEX `riwayat_pendaftaran` ON `riwayat_status` (`pendaftaran_id`);--> statement-breakpoint
CREATE INDEX `kecamatan_kabupaten` ON `wilayah_kecamatan` (`kabupaten_id`);