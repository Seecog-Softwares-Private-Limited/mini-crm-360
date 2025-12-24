-- Migration: Create Plans and UserPlans tables
-- Date: 2025-01-XX
-- Description: Creates tables for subscription plans and user plan assignments

-- Create plans table
CREATE TABLE IF NOT EXISTS `plans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `billingPeriod` ENUM('monthly', 'yearly', 'lifetime', 'free') NOT NULL DEFAULT 'monthly',
  `maxCustomers` INT DEFAULT 50,
  `maxBusinesses` INT DEFAULT 1,
  `maxEmailsPerMonth` INT DEFAULT 100,
  `maxWhatsAppMessagesPerMonth` INT DEFAULT 0,
  `hasEmailTemplates` BOOLEAN NOT NULL DEFAULT TRUE,
  `hasWhatsAppTemplates` BOOLEAN NOT NULL DEFAULT FALSE,
  `hasInvoice` BOOLEAN NOT NULL DEFAULT FALSE,
  `hasAnalytics` BOOLEAN NOT NULL DEFAULT FALSE,
  `hasApiAccess` BOOLEAN NOT NULL DEFAULT FALSE,
  `hasCustomIntegrations` BOOLEAN NOT NULL DEFAULT FALSE,
  `hasPrioritySupport` BOOLEAN NOT NULL DEFAULT FALSE,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `displayOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_plans_active` (`isActive`),
  INDEX `idx_plans_display_order` (`displayOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_plans table
CREATE TABLE IF NOT EXISTS `user_plans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `planId` INT NOT NULL,
  `status` ENUM('active', 'expired', 'cancelled', 'trial') NOT NULL DEFAULT 'trial',
  `startDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `endDate` DATETIME NULL,
  `isCurrent` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`planId`) REFERENCES `plans`(`id`),
  INDEX `idx_user_plans_user` (`userId`),
  INDEX `idx_user_plans_plan` (`planId`),
  INDEX `idx_user_plans_current` (`userId`, `isCurrent`),
  UNIQUE KEY `unique_user_current_plan` (`userId`, `isCurrent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default plans
INSERT INTO `plans` (`name`, `slug`, `description`, `price`, `currency`, `billingPeriod`, `maxCustomers`, `maxBusinesses`, `maxEmailsPerMonth`, `maxWhatsAppMessagesPerMonth`, `hasEmailTemplates`, `hasWhatsAppTemplates`, `hasInvoice`, `hasAnalytics`, `hasApiAccess`, `hasCustomIntegrations`, `hasPrioritySupport`, `isActive`, `displayOrder`) VALUES
('Free Trial', 'free-trial', 'Perfect for getting started and exploring our platform', 0.00, 'INR', 'free', 50, 1, 100, 0, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE, 1),
('Silver Plan', 'silver', 'Ideal for growing businesses with moderate needs', 999.00, 'INR', 'monthly', 500, 3, 5000, 1000, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, 2),
('Gold Plan', 'gold', 'Complete solution for established businesses', 2999.00, 'INR', 'monthly', NULL, NULL, NULL, NULL, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 3)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

