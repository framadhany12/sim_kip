ALTER TABLE `sekolah` ADD `kata_cari` varchar(300) DEFAULT '' NOT NULL;--> statement-breakpoint
-- Harus sama dengan kataCariSekolah() di src/lib/sekolah.ts.
UPDATE `sekolah` SET `kata_cari` = TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONCAT(' ', REGEXP_REPLACE(LOWER(CONCAT_WS(' ', `nama`, `kota`)), '[-.,/()[:space:]]+', ' '), ' '), ' sman ', ' sma negeri '), ' smkn ', ' smk negeri '), ' smas ', ' sma swasta '), ' smks ', ' smk swasta '), ' kab ', ' kabupaten '));
