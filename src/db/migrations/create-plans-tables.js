// src/db/migrations/create-plans-tables.js
import { sequelize } from '../index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const up = async () => {
  try {
    const sqlPath = path.join(__dirname, '../../../database/migrations/create_plans_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await sequelize.query(statement);
        console.log('✅ Executed:', statement.substring(0, 60) + '...');
      } catch (err) {
        // Ignore "Duplicate column" or "Table already exists" errors
        if (err.message && (err.message.includes('Duplicate') || err.message.includes('already exists'))) {
          console.log('⚠️ Already exists, skipping:', statement.substring(0, 60));
        } else {
          throw err;
        }
      }
    }

    console.log('✅ Plans tables migration completed');
  } catch (error) {
    console.error('❌ Error in up migration:', error);
    throw error;
  }
};

export const down = async () => {
  try {
    await sequelize.query('DROP TABLE IF EXISTS `user_plans`');
    await sequelize.query('DROP TABLE IF EXISTS `plans`');
    console.log('✅ Plans tables migration rolled back');
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

