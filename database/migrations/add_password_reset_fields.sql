-- Migration: Add password reset token fields to users table
-- Date: 2025-01-XX
-- Description: Adds passwordResetToken and passwordResetExpires columns for password reset functionality

-- Add passwordResetToken column (stores hashed reset token)
ALTER TABLE `users` 
ADD COLUMN `passwordResetToken` VARCHAR(255) NULL AFTER `socialProvider`;

-- Add passwordResetExpires column (stores token expiration date)
ALTER TABLE `users` 
ADD COLUMN `passwordResetExpires` DATETIME NULL AFTER `passwordResetToken`;

-- Add index for better query performance
CREATE INDEX `idx_users_password_reset_token` ON `users` (`passwordResetToken`);


