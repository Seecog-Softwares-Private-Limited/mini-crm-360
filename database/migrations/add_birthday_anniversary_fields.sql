-- Migration: Add birthday and anniversary fields to customers table
ALTER TABLE `customers`
ADD COLUMN `dateOfBirth` DATE NULL AFTER `consentAt`,
ADD COLUMN `anniversaryDate` DATE NULL AFTER `dateOfBirth`,
ADD INDEX `idx_customers_dob` (`dateOfBirth`),
ADD INDEX `idx_customers_anniversary` (`anniversaryDate`);


