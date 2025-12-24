-- Migration: Add email campaign support to campaigns table
-- Date: 2025-01-XX
-- Description: Adds channelType and emailTemplateId columns to support email campaigns

-- Add channelType column (ENUM: 'whatsapp' or 'email')
ALTER TABLE `campaigns` 
ADD COLUMN `channelType` ENUM('whatsapp', 'email') DEFAULT 'whatsapp' AFTER `businessId`;

-- Add emailTemplateId column (foreign key to email_templates table)
ALTER TABLE `campaigns` 
ADD COLUMN `emailTemplateId` INT NULL AFTER `channelType`;

-- Add foreign key constraint for emailTemplateId (optional, can be added if needed)
-- ALTER TABLE `campaigns` 
-- ADD CONSTRAINT `campaigns_ibfk_email_template` 
-- FOREIGN KEY (`emailTemplateId`) REFERENCES `email_templates` (`id`) 
-- ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for better query performance
CREATE INDEX `idx_campaigns_channel_type` ON `campaigns` (`channelType`);
CREATE INDEX `idx_campaigns_email_template` ON `campaigns` (`emailTemplateId`);

