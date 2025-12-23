-- MySQL dump 10.13  Distrib 8.0.42, for macos15 (x86_64)
--
-- Host: 127.0.0.1    Database: saas_whatsapp_manager
-- ------------------------------------------------------
-- Server version	9.5.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '9d467318-c2c2-11f0-a514-f5199abbdb16:1-881';

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `avatarUrl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firstName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phoneNo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','shop_owner','shop_manager','shop_worker') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'shop_owner',
  `status` enum('active','invited','disabled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `refreshTokens` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `refreshTokenExpiresAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,'Mukesh','Kumar','+919064784636','mukesh@gmail.com','$2b$10$a3W0zGIwr2Qn2Xr/7CQYiOLpzqDSne8F/pvQ6LI1nv/xMU56Rllrm','shop_owner','active','da5d5fc2c80054d0792bf7042a383ccbfb516060639cf8e83858b545f8fe7af3','2025-11-28 09:34:06','2025-10-12 04:51:58','2025-11-21 09:34:06'),(3,NULL,'Sonam','Agarwal','+916206992612','sonamagarwal878@gmail.com','$2b$10$XSQEUkG9XQlzXFGBFjTkKeR5D154fSwajAQPNq2oK.UvwGoYKOD4a','shop_owner','active','9a600714e14ea7077f411a48ea8f008cb224f3ca9d4b7b8f4ffc1d20d97b957e','2025-10-22 08:13:43','2025-10-14 03:54:45','2025-10-15 08:13:43'),(6,NULL,'Test','1','+916786786374','test@gmail.com','$2b$10$kf1KHLAn5SOZn17kUuweEODVVIryVCR3tTmgDauft9AVzfBfC3iW.','shop_owner','active','e92efae584d89fbab1620ded4b371b740398d37df65de210598086512be3809a','2025-12-30 15:38:54','2025-11-16 14:11:35','2025-12-23 15:38:54'),(7,NULL,'pavan','chandu','+919346032495','pavachandu218@gmail.com','$2b$10$HyJYLJmfafrZQENmOEujHu2dnFZSo5ILqLra8a9lnM5bnnCLvpDnO','shop_owner','active','a98c421460266dfe5c27f5445eb577c374407a3ff2296b85e34dfa6432f6ce23','2025-12-30 05:21:50','2025-12-20 09:42:08','2025-12-23 05:21:50'),(8,NULL,'Pankaj','Kumar','+917348820668','pankaj.7613@gmail.com','$2b$10$YTxJWRVEyPafAZG5yITsouAvCAYpvtyL17dnAOKMxEWWcDO8BjlL2','shop_owner','active','373c11c4e766009956fc92060b2a702669cb7132d99d8fe1927ac65677d538c6','2025-12-30 15:43:36','2025-12-23 15:43:19','2025-12-23 15:43:36');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-23 21:21:03
