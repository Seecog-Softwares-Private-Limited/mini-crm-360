-- Migration: Create lead_forms table
CREATE TABLE IF NOT EXISTS `lead_forms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `businessId` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `fields` JSON NOT NULL DEFAULT '[]',
  `successMessage` VARCHAR(500) DEFAULT 'Thank you! We will contact you soon.',
  `redirectUrl` VARCHAR(500) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE SET NULL,
  INDEX `idx_lead_forms_user` (`userId`),
  INDEX `idx_lead_forms_slug` (`slug`),
  INDEX `idx_lead_forms_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

