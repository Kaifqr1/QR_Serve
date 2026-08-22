-- Run this once in the TiDB SQL Editor after selecting the qrserve database.
-- It enables local QRServe email/password credentials.
ALTER TABLE `users` ADD `passwordHash` varchar(255);
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);
