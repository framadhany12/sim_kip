CREATE TABLE `tahun_ajaran` (
	`tahun` int NOT NULL,
	CONSTRAINT `tahun_ajaran_tahun` PRIMARY KEY(`tahun`)
);
--> statement-breakpoint
INSERT INTO `tahun_ajaran` (`tahun`) VALUES (2026);
