-- Migration: Add social login support to users table
-- Date: 2025-01-XX
-- Description: Adds socialId and socialProvider columns to support social login/SSO

-- Add socialId column (stores the user's ID from the social provider)
ALTER TABLE `users` 
ADD COLUMN `socialId` VARCHAR(255) NULL AFTER `refreshTokenExpiresAt`;

-- Add socialProvider column (stores the name of the social provider: google, instagram, facebook, etc.)
ALTER TABLE `users` 
ADD COLUMN `socialProvider` VARCHAR(50) NULL AFTER `socialId`;

-- Add indexes for better query performance
CREATE INDEX `idx_users_social_id` ON `users` (`socialId`);
CREATE INDEX `idx_users_social_provider` ON `users` (`socialProvider`);
CREATE INDEX `idx_users_social_lookup` ON `users` (`socialProvider`, `socialId`);

