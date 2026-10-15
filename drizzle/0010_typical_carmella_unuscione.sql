ALTER TABLE `users` ADD `nik` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_nik_unique` UNIQUE(`nik`);
--> statement-breakpoint
UPDATE `users` u JOIN `pendaftaran` p ON p.`user_id` = u.`id` JOIN `data_diri` d ON d.`pendaftaran_id` = p.`id` SET u.`nik` = d.`nik` WHERE d.`nik` IN (SELECT `nik` FROM (SELECT `nik` FROM `data_diri` GROUP BY `nik` HAVING COUNT(*) = 1) x);
