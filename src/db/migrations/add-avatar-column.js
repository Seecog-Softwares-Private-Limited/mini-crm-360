// src/db/migrations/add-avatar-column.js
import { sequelize } from '../index.js';

export const up = async () => {
  try {
    // Check if avatar column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'avatar'
    `);
    
    if (results.length === 0) {
      // Add avatar column if it doesn't exist
      await sequelize.query(`
        ALTER TABLE \`users\` 
        ADD COLUMN \`avatar\` VARCHAR(500) NULL AFTER \`avatarUrl\`
      `);
      console.log('✅ Added avatar column');
    } else {
      console.log('⚠️ avatar column already exists');
    }

    console.log('✅ Avatar column migration completed');
  } catch (error) {
    console.error('❌ Error in up migration:', error);
    throw error;
  }
};

export const down = async () => {
  try {
    await sequelize.query('ALTER TABLE `users` DROP COLUMN IF EXISTS `avatar`');
    console.log('✅ Avatar column migration rolled back');
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
