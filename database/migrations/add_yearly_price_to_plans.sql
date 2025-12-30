-- Migration: Add yearlyPrice column to plans table
-- Date: 2025-01-XX
-- Description: Adds yearlyPrice column to store yearly pricing separately from monthly pricing

-- Add yearlyPrice column
ALTER TABLE `plans`
ADD COLUMN `yearlyPrice` DECIMAL(10, 2) NULL AFTER `price`;

-- Update existing plans with yearly prices (20% discount as default)
-- Silver Plan: Monthly ₹999, Yearly should be ₹9,590.40 (999 * 12 * 0.8) = ₹9,590
-- Gold Plan: Monthly ₹2,999, Yearly should be ₹28,790.40 (2999 * 12 * 0.8) = ₹28,790
UPDATE `plans` 
SET `yearlyPrice` = CASE 
  WHEN `slug` = 'silver' THEN 9590.00
  WHEN `slug` = 'gold' THEN 28790.00
  ELSE NULL
END
WHERE `slug` IN ('silver', 'gold');

