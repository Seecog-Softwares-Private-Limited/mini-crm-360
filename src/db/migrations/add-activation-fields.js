// src/db/migrations/add-activation-fields.js
import { sequelize } from '../index.js';

export const up = async () => {
  try {
    console.log('Starting migration: Add activation fields to users table...');

    // Check if columns already exist
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('isActivated', 'activationToken', 'activationTokenExpires')
    `);
    
    const existingColumns = results.map(r => r.COLUMN_NAME);
    console.log('Existing activation columns:', existingColumns);
    
    // Add isActivated column if it doesn't exist
    if (!existingColumns.includes('isActivated')) {
      try {
        await sequelize.query(`
          ALTER TABLE \`users\` 
          ADD COLUMN \`isActivated\` BOOLEAN DEFAULT FALSE NOT NULL AFTER \`twoFactorSecret\`
        `);
        console.log('✅ Added isActivated column');
      } catch (err) {
        if (!err.message.includes('Duplicate column')) {
          throw err;
        }
        console.log('⚠️ isActivated column already exists');
      }
    } else {
      console.log('⚠️ isActivated column already exists');
    }
    
    // Add activationToken column if it doesn't exist
    if (!existingColumns.includes('activationToken')) {
      try {
        await sequelize.query(`
          ALTER TABLE \`users\` 
          ADD COLUMN \`activationToken\` VARCHAR(255) NULL AFTER \`isActivated\`
        `);
        console.log('✅ Added activationToken column');
      } catch (err) {
        if (!err.message.includes('Duplicate column')) {
          throw err;
        }
        console.log('⚠️ activationToken column already exists');
      }
    } else {
      console.log('⚠️ activationToken column already exists');
    }
    
    // Add activationTokenExpires column if it doesn't exist
    if (!existingColumns.includes('activationTokenExpires')) {
      try {
        await sequelize.query(`
          ALTER TABLE \`users\` 
          ADD COLUMN \`activationTokenExpires\` DATETIME NULL AFTER \`activationToken\`
        `);
        console.log('✅ Added activationTokenExpires column');
      } catch (err) {
        if (!err.message.includes('Duplicate column')) {
          throw err;
        }
        console.log('⚠️ activationTokenExpires column already exists');
      }
    } else {
      console.log('⚠️ activationTokenExpires column already exists');
    }
    
    // Add index on activationToken if it doesn't exist
    try {
      await sequelize.query(`
        CREATE INDEX \`idx_users_activation_token\` ON \`users\` (\`activationToken\`)
      `);
      console.log('✅ Added index on activationToken');
    } catch (err) {
      if (err.message.includes('Duplicate key name') || err.message.includes('already exists')) {
        console.log('⚠️ Index on activationToken already exists');
      } else {
        throw err;
      }
    }

    console.log('✅ Activation fields migration completed');
  } catch (error) {
    console.error('❌ Error in up migration:', error);
    throw error;
  }
};

export const down = async () => {
  try {
    await sequelize.query('DROP INDEX IF EXISTS `idx_users_activation_token` ON `users`');
    await sequelize.query('ALTER TABLE `users` DROP COLUMN IF EXISTS `activationTokenExpires`');
    await sequelize.query('ALTER TABLE `users` DROP COLUMN IF EXISTS `activationToken`');
    await sequelize.query('ALTER TABLE `users` DROP COLUMN IF EXISTS `isActivated`');
    console.log('✅ Activation fields migration rolled back');
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

