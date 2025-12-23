-- Quick fix: Add missing columns to campaigns table
-- Run this SQL script in your MySQL database to fix the error

-- Add channelType column (if it doesn't exist)
ALTER TABLE `campaigns` 
ADD COLUMN `channelType` ENUM('whatsapp', 'email') DEFAULT 'whatsapp' AFTER `businessId`;

-- Add emailTemplateId column (if it doesn't exist)
ALTER TABLE `campaigns` 
ADD COLUMN `emailTemplateId` INT NULL AFTER `channelType`;

-- Add indexes for better performance
CREATE INDEX `idx_campaigns_channel_type` ON `campaigns` (`channelType`);
CREATE INDEX `idx_campaigns_email_template` ON `campaigns` (`emailTemplateId`);
