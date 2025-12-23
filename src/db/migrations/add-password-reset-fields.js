// src/db/migrations/add-password-reset-fields.js
import { sequelize } from '../index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const up = async () => {
  try {
    const sqlPath = path.join(__dirname, '../../../database/migrations/add_password_reset_fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await sequelize.query(statement);
        console.log('✅ Executed:', statement.substring(0, 50) + '...');
      } catch (err) {
        // Ignore "Duplicate column" errors
        if (err.message && err.message.includes('Duplicate column')) {
          console.log('⚠️ Column already exists, skipping:', statement.substring(0, 50));
        } else {
          throw err;
        }
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

