-- Migration: Create notes_timeline table
CREATE TABLE IF NOT EXISTS `notes_timeline` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `customerId` INT NOT NULL,
  `type` ENUM('note', 'campaign_sent', 'invoice_created', 'whatsapp_sent', 'email_sent', 'task_created', 'task_completed', 'customer_created', 'customer_updated') NOT NULL DEFAULT 'note',
  `title` VARCHAR(255) NULL,
  `content` TEXT NULL,
  `metadata` JSON NULL,
  `createdBy` INT NULL COMMENT 'User ID who created this entry (null for auto-logged events)',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_notes_user` (`userId`),
  INDEX `idx_notes_customer` (`customerId`),
  INDEX `idx_notes_type` (`type`),
  INDEX `idx_notes_created_at` (`createdAt`),
  INDEX `idx_notes_customer_created` (`customerId`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

