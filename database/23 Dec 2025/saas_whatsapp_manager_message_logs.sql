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
-- Table structure for table `message_logs`
--

DROP TABLE IF EXISTS `message_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaignId` int NOT NULL,
  `customerId` int NOT NULL,
  `to` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `waMessageId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('queued','sent','delivered','read','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `error` json DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `templateId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `message_logs_campaign_id_customer_id` (`campaignId`,`customerId`),
  KEY `customerId` (`customerId`),
  KEY `templateId` (`templateId`),
  CONSTRAINT `message_logs_ibfk_1` FOREIGN KEY (`campaignId`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `message_logs_ibfk_2` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `message_logs_ibfk_3` FOREIGN KEY (`templateId`) REFERENCES `templates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_logs`
--

LOCK TABLES `message_logs` WRITE;
/*!40000 ALTER TABLE `message_logs` DISABLE KEYS */;
INSERT INTO `message_logs` VALUES (7,5,4,'+916206992612','wamid.HBgMOTE2MjA2OTkyNjEyFQIAERgSNDJDQTk2MkM1MTc2ODlGMzI5AA==','sent','{\"error\": {\"code\": 190, \"type\": \"OAuthException\", \"message\": \"Error validating access token: Session has expired on Tuesday, 07-Oct-25 07:00:00 PDT. The current time is Sunday, 16-Nov-25 01:32:57 PST.\", \"fbtrace_id\": \"ATNPdi-NfrqfJcG__yUAnyL\", \"error_subcode\": 463}}','2025-10-15 10:55:46','2025-11-16 09:37:48',NULL),(8,5,2,'+917348820668','wamid.HBgMOTE3MzQ4ODIwNjY4FQIAERgSMDMxMzFGNjNEQjc1NDIxQzg4AA==','sent','{\"error\": {\"code\": 190, \"type\": \"OAuthException\", \"message\": \"Error validating access token: Session has expired on Tuesday, 07-Oct-25 07:00:00 PDT. The current time is Sunday, 16-Nov-25 01:32:57 PST.\", \"fbtrace_id\": \"AnbGOMG0SNrGgar95cUjfmj\", \"error_subcode\": 463}}','2025-10-15 10:55:48','2025-11-16 09:37:50',NULL),(9,5,1,'+919064784636','wamid.HBgMOTE5MDY0Nzg0NjM2FQIAERgSOUM2MDlEMUE5MTZCRjZCN0NDAA==','sent','{\"error\": {\"code\": 190, \"type\": \"OAuthException\", \"message\": \"Error validating access token: Session has expired on Tuesday, 07-Oct-25 07:00:00 PDT. The current time is Sunday, 16-Nov-25 01:32:57 PST.\", \"fbtrace_id\": \"AZHUw-aNfZpphd3yCwc8UZW\", \"error_subcode\": 463}}','2025-10-15 10:55:49','2025-11-16 09:37:51',NULL),(10,6,261,'pankaj.7613@gmail.com',NULL,'sent',NULL,'2025-12-23 14:31:55','2025-12-23 14:31:58',NULL),(11,7,261,'pankaj.76131@gmail.com',NULL,'sent',NULL,'2025-12-23 15:23:07','2025-12-23 15:23:10',NULL);
/*!40000 ALTER TABLE `message_logs` ENABLE KEYS */;
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

-- Dump completed on 2025-12-23 21:21:04
