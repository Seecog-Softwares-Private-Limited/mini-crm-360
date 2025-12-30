// src/db/migrations/add-all-profile-columns.js
import { sequelize } from '../index.js';

export const up = async () => {
  try {
    // Get all existing columns
    const [existingColumns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users'
    `);
    
    const columnNames = existingColumns.map(col => col.COLUMN_NAME);
    console.log('Existing columns:', columnNames.join(', '));
    
    // List of columns that should exist
    const requiredColumns = [
      { name: 'language', type: 'VARCHAR(10)', default: "DEFAULT 'en'", after: 'timezone' },
      { name: 'notificationPreferences', type: 'JSON', default: 'NULL', after: 'language' },
      { name: 'twoFactorEnabled', type: 'BOOLEAN', default: 'DEFAULT FALSE', after: 'notificationPreferences' },
      { name: 'twoFactorSecret', type: 'VARCHAR(255)', default: 'NULL', after: 'twoFactorEnabled' }
    ];
    
    // Add missing columns
    for (const col of requiredColumns) {
      if (!columnNames.includes(col.name)) {
        try {
          await sequelize.query(`
            ALTER TABLE \`users\` 
            ADD COLUMN \`${col.name}\` ${col.type} ${col.default} AFTER \`${col.after}\`
          `);
          console.log(`✅ Added ${col.name} column`);
        } catch (err) {
          console.error(`❌ Error adding ${col.name}:`, err.message);
        }
      } else {
        console.log(`⚠️ ${col.name} column already exists`);
      }
    }

    console.log('✅ All profile columns migration completed');
  } catch (error) {
    console.error('❌ Error in up migration:', error);
    throw error;
  }
};

export const down = async () => {
  try {
    await sequelize.query('ALTER TABLE `users` DROP COLUMN IF EXISTS `twoFactorSecret`');
    await sequelize.query('ALTER TABLE `users` DROP COLUMN IF EXISTS `twoFactorEnabled`');
    await sequelize.query('ALTER TABLE `users` DROP COLUMN IF EXISTS `notificationPreferences`');
    await sequelize.query('ALTER TABLE `users` DROP COLUMN IF EXISTS `language`');
    console.log('✅ All profile columns migration rolled back');
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
