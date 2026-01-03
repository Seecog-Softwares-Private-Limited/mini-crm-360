// src/db/migrations/update-templates-menu-label.js
import { sequelize } from '../index.js';
import { MenuItem } from '../../models/MenuItem.js';

async function updateTemplatesMenuLabel() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Update Templates menu item label
    const [affectedRows] = await MenuItem.update(
      {
        label: 'Message Templates'
      },
      {
        where: { key: 'templates' }
      }
    );

    if (affectedRows > 0) {
      console.log('✅ Updated Templates menu item label to "Message Templates"');
    } else {
      console.log('ℹ️  Templates menu item not found');
    }

    console.log('\n✅ Menu item label update completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating menu item label:', error);
    process.exit(1);
  }
}

updateTemplatesMenuLabel();

import { sequelize } from '../index.js';
import { MenuItem } from '../../models/MenuItem.js';

async function updateTemplatesMenuLabel() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Update Templates menu item label
    const [affectedRows] = await MenuItem.update(
      {
        label: 'Message Templates'
      },
      {
        where: { key: 'templates' }
      }
    );

    if (affectedRows > 0) {
      console.log('✅ Updated Templates menu item label to "Message Templates"');
    } else {
      console.log('ℹ️  Templates menu item not found');
    }

    console.log('\n✅ Menu item label update completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating menu item label:', error);
    process.exit(1);
  }
}

updateTemplatesMenuLabel();

