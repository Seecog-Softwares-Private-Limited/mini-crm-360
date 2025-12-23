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
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `firstName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `middleName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `empId` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeType` enum('Permanent','Contract','Intern','Consultant','Trainee') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Permanent',
  `empName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `gender` enum('Male','Female','Non-binary','Prefer not to say') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `maritalStatus` enum('Single','Married','Other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bloodGroup` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nationality` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `religion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `casteCategory` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `languagesKnown` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `empDesignation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `empDepartment` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `division` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subDepartment` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gradeBandLevel` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reportingManagerId` int DEFAULT NULL,
  `empWorkLoc` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `empDateOfJoining` date NOT NULL,
  `probationPeriodMonths` int DEFAULT NULL,
  `confirmationDate` date DEFAULT NULL,
  `employmentStatus` enum('Active','On Leave','Resigned','Terminated','Retired') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `workMode` enum('On-site','Hybrid','Remote') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'On-site',
  `empDob` date NOT NULL,
  `empCtc` decimal(15,2) NOT NULL,
  `grossSalaryMonthly` decimal(15,2) DEFAULT NULL,
  `basicSalary` decimal(15,2) DEFAULT NULL,
  `hra` decimal(15,2) DEFAULT NULL,
  `conveyanceAllowance` decimal(15,2) DEFAULT NULL,
  `medicalAllowance` decimal(15,2) DEFAULT NULL,
  `specialAllowance` decimal(15,2) DEFAULT NULL,
  `performanceBonus` decimal(15,2) DEFAULT NULL,
  `variablePay` decimal(15,2) DEFAULT NULL,
  `overtimeEligible` tinyint(1) NOT NULL DEFAULT '0',
  `shiftAllowance` decimal(15,2) DEFAULT NULL,
  `pfDeduction` decimal(15,2) DEFAULT NULL,
  `esiDeduction` decimal(15,2) DEFAULT NULL,
  `professionalTax` decimal(15,2) DEFAULT NULL,
  `tdsDeduction` decimal(15,2) DEFAULT NULL,
  `netSalary` decimal(15,2) DEFAULT NULL,
  `shiftName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shiftCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shiftStartTime` time DEFAULT NULL,
  `shiftEndTime` time DEFAULT NULL,
  `totalWorkHours` decimal(4,2) DEFAULT NULL,
  `breakDurationMinutes` int DEFAULT NULL,
  `shiftType` enum('Fixed','Rotational','Split','Flexible') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shiftRotationCycle` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gracePeriodMinutes` int DEFAULT NULL,
  `halfDayRuleHours` decimal(4,2) DEFAULT NULL,
  `shiftEffectiveFrom` date DEFAULT NULL,
  `workTimezone` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idProofType` enum('Aadhaar','PAN','Passport','Driving License','Voter ID','National ID','Other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idProofNumber` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idVerificationStatus` enum('Pending','Verified','Rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `idVerificationDate` date DEFAULT NULL,
  `idVerifiedBy` int DEFAULT NULL,
  `idExpiryDate` date DEFAULT NULL,
  `idCountryOfIssue` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `workEmail` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `authMethod` enum('Password','SSO','SAML','OAuth','Other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Password',
  `mfaEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `accountStatus` enum('Active','Locked','Suspended','Disabled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Active',
  `accountCreatedAt` datetime DEFAULT NULL,
  `lastLoginAt` datetime DEFAULT NULL,
  `lastPasswordResetAt` datetime DEFAULT NULL,
  `forcePasswordReset` tinyint(1) NOT NULL DEFAULT '0',
  `allowedLoginIps` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `biometricEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `passwordPolicyStatus` enum('Compliant','Non-compliant') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `systemRole` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `exitType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resignationDate` date DEFAULT NULL,
  `exitReason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `noticePeriodDays` int DEFAULT NULL,
  `noticeServed` tinyint(1) NOT NULL DEFAULT '0',
  `lastWorkingDay` date DEFAULT NULL,
  `exitStatus` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `exitCategory` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `empEmail` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `empPhone` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `altPhone` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergencyContactName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergencyContactRelation` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergencyContactNumber` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `presentAddressLine1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `presentAddressLine2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `presentCity` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `presentState` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `presentZip` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `presentCountry` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permanentSameAsPresent` tinyint(1) NOT NULL DEFAULT '0',
  `permanentAddressLine1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permanentAddressLine2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permanentCity` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permanentState` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permanentZip` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permanentCountry` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `internship_start_date` date DEFAULT NULL,
  `internship_end_date` date DEFAULT NULL,
  `internship_offer_date` date DEFAULT NULL,
  `internship_designation` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `empId` (`empId`),
  UNIQUE KEY `employees_user_id_emp_id` (`userId`,`empId`),
  UNIQUE KEY `employees_user_id_emp_email` (`userId`,`empEmail`),
  UNIQUE KEY `employees_user_id_emp_phone` (`userId`,`empPhone`),
  KEY `employees_user_id_is_active` (`userId`,`isActive`),
  KEY `employees_emp_department` (`empDepartment`),
  KEY `employees_emp_designation` (`empDesignation`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (2,6,'Mukesh',NULL,'Kumhar','EMP0001','Permanent','Mukesh Kumhar','Male','Single','B+','Indian','Hindu','OBC','English, Hindi','Lead Developer','Engineering',NULL,NULL,NULL,3,'3rd Floor, ABC Tech Park, Outer Ring Road, Marathahalli, Bengaluru, Karnataka, 560037, India','2025-05-09',NULL,NULL,'Active','Remote','2003-01-20',8000000.00,8000.00,8000.00,NULL,NULL,NULL,0.00,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Pending',NULL,NULL,NULL,NULL,NULL,NULL,'Password',0,'Active',NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'mukeshkumhar906@gmail.com','9064784636',NULL,'Test','test','8967546753','Lalpur','Near Maa Ram Pyari Hospital','Ranchi','Jharkhand','834001','India',1,'Lalpur',NULL,'Ranchi','Jharkhand','834001','India',1,'2025-11-19 09:20:46','2025-11-30 09:43:03',NULL,NULL,NULL,NULL),(3,6,'Sonam',NULL,'Agarwal','EMP0002','Permanent','Sonam Agarwal','Female','Single','B+',NULL,NULL,NULL,NULL,'Senior HR','HR',NULL,NULL,NULL,NULL,'Ranchi','2024-01-01',NULL,NULL,'Active','Remote','2000-01-18',240000.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Pending',NULL,NULL,NULL,NULL,NULL,NULL,'Password',0,'Active',NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'sonam@gmail.com','6206992612',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,1,'2025-11-21 10:34:37','2025-11-21 10:43:28',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
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
