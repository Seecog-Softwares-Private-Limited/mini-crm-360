#!/usr/bin/env node

/**
 * MySQL Connection Test
 * 
 * This script tests the MySQL connection and creates the database if it doesn't exist.
 * Run with: node scripts/setup-mysql.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

async function setupMySQL() {
  console.log('🔧 Setting up MySQL database...\n');
  console.log(`📍 Connecting to MySQL at ${config.host}:${config.port}...`);

  try {
    // Connect without specifying database
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL server\n');

    const dbName = process.env.DB_NAME || 'billing_db';

    // Create database
    console.log(`📦 Creating database: ${dbName}...`);
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Database '${dbName}' ready\n`);

    // Close this connection
    await connection.end();

    // Now connect to the database
    const dbConnection = await mysql.createConnection({
      ...config,
      database: dbName
    });

    console.log(`✅ Connected to database '${dbName}'\n`);
    console.log('📋 Creating tables...\n');

    // Create subscriptions table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id VARCHAR(100) PRIMARY KEY,
        userId VARCHAR(100) NOT NULL,
        planCode VARCHAR(100) NOT NULL,
        razorpaySubscriptionId VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        totalCount INT,
        billedCount INT DEFAULT 0,
        currentCycleStart DATETIME,
        currentCycleEnd DATETIME,
        nextBillingDate DATETIME,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        cancelledAt DATETIME,
        UNIQUE KEY unique_user_plan (userId, planCode),
        INDEX idx_user (userId),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created subscriptions table');

    // Create invoices table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(100) PRIMARY KEY,
        subscriptionId VARCHAR(100) NOT NULL,
        userId VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'INR',
        status VARCHAR(50) DEFAULT 'issued',
        razorpayPaymentId VARCHAR(100),
        razorpayInvoiceId VARCHAR(100),
        dueDate DATETIME,
        issuedDate DATETIME NOT NULL,
        paidDate DATETIME,
        failedDate DATETIME,
        description TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id) ON DELETE CASCADE,
        INDEX idx_subscription (subscriptionId),
        INDEX idx_user (userId),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created invoices table');

    // Create webhook logs table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id VARCHAR(100) PRIMARY KEY,
        eventId VARCHAR(100) NOT NULL UNIQUE,
        eventType VARCHAR(100) NOT NULL,
        data JSON,
        processed TINYINT DEFAULT 0,
        createdAt DATETIME NOT NULL,
        INDEX idx_event_type (eventType),
        INDEX idx_processed (processed)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created webhook_logs table\n');

    await dbConnection.end();

    console.log('🎉 MySQL setup complete!');
    console.log('\n📝 Your database configuration:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Database: ${dbName}`);
    console.log('\n🚀 You can now run: npm run dev');

  } catch (error) {
    console.error('\n❌ Error setting up MySQL:');
    console.error(error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Fix: Check your MySQL username and password in .env');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Fix: Make sure MySQL server is running');
    }
    
    process.exit(1);
  }
}

setupMySQL();
