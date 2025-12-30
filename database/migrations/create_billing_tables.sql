-- Migration: Create billing tables for Razorpay integration
-- Date: 30 Dec 2025

-- Payment Logs table
CREATE TABLE IF NOT EXISTS payment_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  planId INT NOT NULL,
  razorpayOrderId VARCHAR(100) UNIQUE,
  razorpayPaymentId VARCHAR(100),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  billingCycle ENUM('monthly', 'yearly') NOT NULL DEFAULT 'monthly',
  status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  errorMessage TEXT,
  metadata JSON,
  paidAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payment_logs_userId (userId),
  INDEX idx_payment_logs_razorpayOrderId (razorpayOrderId),
  INDEX idx_payment_logs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  planId INT NOT NULL,
  userPlanId INT,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  razorpayOrderId VARCHAR(100),
  razorpayPaymentId VARCHAR(100),
  razorpayInvoiceId VARCHAR(100),
  status ENUM('issued', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'issued',
  billingCycle ENUM('monthly', 'yearly'),
  description TEXT,
  paidAt DATETIME,
  dueDate DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_invoices_userId (userId),
  INDEX idx_invoices_razorpayOrderId (razorpayOrderId),
  INDEX idx_invoices_razorpayPaymentId (razorpayPaymentId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Webhook Logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  eventId VARCHAR(100) NOT NULL UNIQUE,
  eventType VARCHAR(100) NOT NULL,
  data JSON,
  processed TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_webhook_logs_eventId (eventId),
  INDEX idx_webhook_logs_eventType (eventType),
  INDEX idx_webhook_logs_processed (processed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscriptions table (for Razorpay recurring subscriptions)
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  planId INT NOT NULL,
  razorpaySubscriptionId VARCHAR(100) UNIQUE,
  status ENUM('pending', 'active', 'past_due', 'cancelled', 'expired') NOT NULL DEFAULT 'pending',
  totalCount INT DEFAULT 12,
  billedCount INT DEFAULT 0,
  currentCycleStart DATETIME,
  currentCycleEnd DATETIME,
  cancelAtPeriodEnd TINYINT(1) NOT NULL DEFAULT 0,
  cancelledAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subscriptions_userId (userId),
  INDEX idx_subscriptions_razorpaySubscriptionId (razorpaySubscriptionId),
  INDEX idx_subscriptions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Razorpay Plan Mapping table
CREATE TABLE IF NOT EXISTS razorpay_plan_mappings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  planId INT NOT NULL UNIQUE,
  razorpayPlanId VARCHAR(100) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (planId) REFERENCES plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
