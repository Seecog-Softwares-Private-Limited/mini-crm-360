// src/db/migrations/update-menu-items-labels.js
import { sequelize } from '../index.js';
import { MenuItem } from '../../models/MenuItem.js';

async function updateMenuItemsLabels() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Update existing menu item labels
    const updates = [
      {
        key: 'business',
        updates: { label: 'Account' }
      },
      {
        key: 'tasks',
        updates: { label: 'Activities' }
      },
      {
        key: 'notes',
        updates: { label: 'Activity Timeline' }
      }
    ];

    let updatedCount = 0;
    for (const update of updates) {
      const [affectedRows] = await MenuItem.update(
        update.updates,
        {
          where: { key: update.key }
        }
      );
      if (affectedRows > 0) {
        updatedCount++;
        console.log(`✅ Updated menu item '${update.key}' label to '${update.updates.label}'`);
      } else {
        console.log(`ℹ️  Menu item '${update.key}' not found or already updated`);
      }
    }

    // Check if Social Publisher already exists
    const existingSocialPublisher = await MenuItem.findOne({
      where: { key: 'social-publisher' }
    });

    if (!existingSocialPublisher) {
      // Get the highest displayOrder for crm_tools category
      const maxOrder = await MenuItem.max('displayOrder', {
        where: { category: 'crm_tools' }
      });
      const nextOrder = (maxOrder || 0) + 1;

      // Add Social Publisher menu item
      await MenuItem.create({
        key: 'social-publisher',
        label: 'Social Publisher',
        icon: 'fas fa-share-alt',
        route: '/social-publisher',
        isLocked: false,
        requiresPlan: null,
        displayOrder: nextOrder,
        category: 'crm_tools',
        description: 'Schedule and publish content to social media platforms'
      });
      console.log('✅ Created Social Publisher menu item');
    } else {
      console.log('ℹ️  Social Publisher menu item already exists');
    }

    // Check if Templates already exists
    const existingTemplates = await MenuItem.findOne({
      where: { key: 'templates' }
    });

    if (!existingTemplates) {
      // Get the highest displayOrder for crm_tools category
      const maxOrder = await MenuItem.max('displayOrder', {
        where: { category: 'crm_tools' }
      });
      const nextOrder = (maxOrder || 0) + 1;

      // Add Templates menu item
      await MenuItem.create({
        key: 'templates',
        label: 'Templates',
        icon: 'fas fa-file-alt',
        route: '/templates',
        isLocked: false,
        requiresPlan: null,
        displayOrder: nextOrder,
        category: 'crm_tools',
        description: 'Create and manage email and WhatsApp templates'
      });
      console.log('✅ Created Templates menu item');
    } else {
      console.log('ℹ️  Templates menu item already exists');
    }

    console.log(`\n✅ Menu items migration completed successfully! Updated ${updatedCount} items.\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating menu items:', error);
    process.exit(1);
  }
}

updateMenuItemsLabels();



      // Add Templates menu item
      await MenuItem.create({
        key: 'templates',
        label: 'Templates',
        icon: 'fas fa-file-alt',
        route: '/templates',
        isLocked: false,
        requiresPlan: null,
        displayOrder: nextOrder,
        category: 'crm_tools',
        description: 'Create and manage email and WhatsApp templates'
      });
      console.log('✅ Created Templates menu item');
    } else {
      console.log('ℹ️  Templates menu item already exists');
    }

    console.log(`\n✅ Menu items migration completed successfully! Updated ${updatedCount} items.\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating menu items:', error);
    process.exit(1);
  }
}

updateMenuItemsLabels();

