// src/db/migrations/add-password-reset-fields.js
import { sequelize } from '../index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const up = async () => {
  try {
    // Check if columns already exist
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('passwordResetToken', 'passwordResetExpires')
    `);
    
    const existingColumns = results.map(r => r.COLUMN_NAME);
    
    // Add passwordResetToken column if it doesn't exist
    if (!existingColumns.includes('passwordResetToken')) {
      try {
        await sequelize.query(`
          ALTER TABLE \`users\` 
          ADD COLUMN \`passwordResetToken\` VARCHAR(255) NULL AFTER \`refreshTokenExpiresAt\`
        `);
        console.log('✅ Added passwordResetToken column');
      } catch (err) {
        if (!err.message.includes('Duplicate column')) {
          throw err;
        }
        console.log('⚠️ passwordResetToken column already exists');
      }
    } else {
      console.log('⚠️ passwordResetToken column already exists');
    }
    
    // Add passwordResetExpires column if it doesn't exist
    if (!existingColumns.includes('passwordResetExpires')) {
      try {
        await sequelize.query(`
          ALTER TABLE \`users\` 
          ADD COLUMN \`passwordResetExpires\` DATETIME NULL AFTER \`passwordResetToken\`
        `);
        console.log('✅ Added passwordResetExpires column');
      } catch (err) {
        if (!err.message.includes('Duplicate column')) {
          throw err;
        }
        console.log('⚠️ passwordResetExpires column already exists');
      }
    } else {
      console.log('⚠️ passwordResetExpires column already exists');
    }
    
    // Add index on passwordResetToken if it doesn't exist
    try {
      await sequelize.query(`
        CREATE INDEX \`idx_users_password_reset_token\` ON \`users\` (\`passwordResetToken\`)
      `);
      console.log('✅ Added index on passwordResetToken');
    } catch (err) {
      if (err.message.includes('Duplicate key name') || err.message.includes('already exists')) {
        console.log('⚠️ Index on passwordResetToken already exists');
      } else {
        throw err;
      }
    }

    console.log('✅ Password reset fields migration completed');
  } catch (error) {
    console.error('❌ Error in up migration:', error);
    throw error;
  }
};

export const down = async () => {
  try {
    await sequelize.query('DROP INDEX IF EXISTS `idx_users_password_reset_token` ON `users`');
    await sequelize.query('ALTER TABLE `users` DROP COLUMN IF EXISTS `passwordResetExpires`');
    await sequelize.query('ALTER TABLE `users` DROP COLUMN IF EXISTS `passwordResetToken`');
    console.log('✅ Password reset fields migration rolled back');
  } catch (error) {
    console.error('❌ Error in down migration:', error);
    throw error;
  }
};

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  up()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

