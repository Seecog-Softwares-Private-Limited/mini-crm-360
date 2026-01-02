-- Migration: Create tasks table for Tasks & Follow-ups feature
-- Date: 2025-01-XX
-- Description: Creates table for managing tasks and follow-ups against customers

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `customerId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `type` ENUM('call', 'meeting', 'payment_followup', 'other') NOT NULL DEFAULT 'other',
  `status` ENUM('pending', 'done', 'cancelled') NOT NULL DEFAULT 'pending',
  `dueDate` DATETIME NOT NULL,
  `reminderDate` DATETIME NULL,
  `isReminderSent` BOOLEAN NOT NULL DEFAULT FALSE,
  `priority` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
  INDEX `idx_tasks_user` (`userId`),
  INDEX `idx_tasks_customer` (`customerId`),
  INDEX `idx_tasks_status` (`status`),
  INDEX `idx_tasks_due_date` (`dueDate`),
  INDEX `idx_tasks_user_status` (`userId`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


