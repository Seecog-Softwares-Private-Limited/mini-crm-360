// src/db/migrations/create-menu-items-table.js
import { sequelize } from '../index.js';
import { MenuItem } from '../../models/MenuItem.js';

async function createMenuItemsTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Sync the model (creates table if it doesn't exist)
    await MenuItem.sync({ alter: true });
    console.log('✅ Menu items table created/updated.');

    // Check if menu items already exist
    const existingItems = await MenuItem.count();
    
    if (existingItems === 0) {
      // Insert default CRM Tools menu items
      const defaultMenuItems = [
        {
          key: 'dashboard',
          label: 'Dashboard',
          icon: 'fas fa-tachometer-alt',
          route: '/dashboard',
          isLocked: false,
          requiresPlan: null,
          displayOrder: 1,
          category: 'crm_tools',
          description: 'Main dashboard with overview statistics'
        },
        {
          key: 'business',
          label: 'Business',
          icon: 'fas fa-building',
          route: '/business',
          isLocked: false,
          requiresPlan: null,
          displayOrder: 2,
          category: 'crm_tools',
          description: 'Manage business profiles and settings'
        },
        {
          key: 'customers',
          label: 'Customers',
          icon: 'fas fa-users',
          route: '/customers',
          isLocked: false,
          requiresPlan: null,
          displayOrder: 3,
          category: 'crm_tools',
          description: 'Manage customer database'
        },
        {
          key: 'campaigns',
          label: 'Campaigns',
          icon: 'fas fa-bullhorn',
          route: '/campaigns',
          isLocked: false,
          requiresPlan: null,
          displayOrder: 4,
          category: 'crm_tools',
          description: 'Create and manage marketing campaigns'
        },
        {
          key: 'tasks',
          label: 'Tasks & Follow-ups',
          icon: 'fas fa-tasks',
          route: '/tasks',
          isLocked: false,
          requiresPlan: null,
          displayOrder: 5,
          category: 'crm_tools',
          description: 'Manage tasks and follow-up reminders'
        },
        {
          key: 'notes',
          label: 'Notes & Timeline',
          icon: 'fas fa-sticky-note',
          route: '/notes',
          isLocked: false,
          requiresPlan: null,
          displayOrder: 6,
          category: 'crm_tools',
          description: 'Add notes and view activity timeline'
        },
        {
          key: 'reminders',
          label: 'Birthday & Anniversary',
          icon: 'fas fa-birthday-cake',
          route: '/reminders',
          isLocked: false,
          requiresPlan: null,
          displayOrder: 7,
          category: 'crm_tools',
          description: 'Manage birthday and anniversary reminders'
        },
        {
          key: 'leadForms',
          label: 'Lead Capture Forms',
          icon: 'fas fa-wpforms',
          route: '/lead-forms',
          isLocked: false,
          requiresPlan: null,
          displayOrder: 8,
          category: 'crm_tools',
          description: 'Create and manage lead capture forms'
        },
        {
          key: 'invoice',
          label: 'Invoice',
          icon: 'fas fa-file-invoice-dollar',
          route: '/invoice',
          isLocked: false,
          requiresPlan: 'silver', // Requires silver plan or higher
          displayOrder: 9,
          category: 'crm_tools',
          description: 'Generate and manage invoices'
        }
      ];

      await MenuItem.bulkCreate(defaultMenuItems);
      console.log(`✅ Created ${defaultMenuItems.length} default menu items.`);
    } else {
      console.log(`ℹ️  Menu items already exist (${existingItems} items). Skipping seed.`);
    }

    console.log('\n✅ Menu items migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating menu items table:', error);
    process.exit(1);
  }
}

createMenuItemsTable();

