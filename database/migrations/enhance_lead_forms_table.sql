-- Migration: Enhance lead_forms table with new features
ALTER TABLE `lead_forms`
ADD COLUMN `status` ENUM('draft', 'published') DEFAULT 'draft' AFTER `isActive`,
ADD COLUMN `theme` JSON NULL AFTER `redirectUrl`,
ADD COLUMN `leadSettings` JSON NULL AFTER `theme`,
ADD COLUMN `successBehavior` JSON NULL AFTER `leadSettings`,
ADD COLUMN `notifications` JSON NULL AFTER `successBehavior`,
ADD COLUMN `antiSpam` JSON NULL AFTER `notifications`,
ADD COLUMN `consentRequired` BOOLEAN DEFAULT FALSE AFTER `antiSpam`,
ADD COLUMN `consentText` VARCHAR(500) NULL AFTER `consentRequired`,
ADD COLUMN `analytics` JSON NULL AFTER `consentText`;

-- Create form_submissions table for analytics
CREATE TABLE IF NOT EXISTS `form_submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `formId` INT NOT NULL,
  `customerId` INT NULL,
  `submittedData` JSON NOT NULL,
  `ipAddress` VARCHAR(45) NULL,
  `userAgent` TEXT NULL,
  `referrer` VARCHAR(500) NULL,
  `utmSource` VARCHAR(255) NULL,
  `utmCampaign` VARCHAR(255) NULL,
  `utmMedium` VARCHAR(255) NULL,
  `status` ENUM('new', 'processed', 'duplicate', 'spam') DEFAULT 'new',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`formId`) REFERENCES `lead_forms`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL,
  INDEX `idx_submissions_form` (`formId`),
  INDEX `idx_submissions_customer` (`customerId`),
  INDEX `idx_submissions_status` (`status`),
  INDEX `idx_submissions_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

