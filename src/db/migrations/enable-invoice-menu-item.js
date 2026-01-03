// src/db/migrations/enable-invoice-menu-item.js
import { sequelize } from '../index.js';
import { MenuItem } from '../../models/MenuItem.js';
import { PlanMenuItem } from '../../models/PlanMenuItem.js';
import { Plan } from '../../models/Plan.js';

async function enableInvoiceMenuItem() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // 1. Update Invoice menu item to be unlocked
    const [affectedRows] = await MenuItem.update(
      {
        isLocked: false,
        requiresPlan: null // Remove plan requirement
      },
      {
        where: { key: 'invoice' }
      }
    );

    if (affectedRows > 0) {
      console.log('✅ Updated Invoice menu item: unlocked and removed plan requirement');
    } else {
      console.log('ℹ️  Invoice menu item not found or already updated');
    }

    // 2. Unlock Invoice for all plans in PlanMenuItem table
    try {
      const [planMenuItemRows] = await PlanMenuItem.update(
        { isLocked: false },
        {
          where: {
            menuItemId: sequelize.literal(`(SELECT id FROM menu_items WHERE \`key\` = 'invoice')`)
          }
        }
      );
      console.log(`✅ Unlocked Invoice menu item for ${planMenuItemRows} plan(s)`);
    } catch (pmError) {
      if (pmError.name === 'SequelizeDatabaseError' && pmError.message.includes('doesn\'t exist')) {
        console.log('ℹ️  PlanMenuItem table does not exist, skipping plan-specific unlock');
      } else {
        // Try alternative approach - get menu item ID first
        const invoiceMenuItem = await MenuItem.findOne({ where: { key: 'invoice' } });
        if (invoiceMenuItem) {
          const [planMenuItemRows] = await PlanMenuItem.update(
            { isLocked: false },
            { where: { menuItemId: invoiceMenuItem.id } }
          );
          console.log(`✅ Unlocked Invoice menu item for ${planMenuItemRows} plan(s)`);
        }
      }
    }

    // 3. Enable hasInvoice feature for all plans
    try {
      const [planRows] = await Plan.update(
        { hasInvoice: true },
        { where: {} }
      );
      console.log(`✅ Enabled hasInvoice feature for ${planRows} plan(s)`);
    } catch (planError) {
      console.log('ℹ️  Could not update plans (table may not exist or column may not exist):', planError.message);
    }

    console.log('\n✅ Invoice menu item enabled successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error enabling Invoice menu item:', error);
    process.exit(1);
  }
}

enableInvoiceMenuItem();

import { sequelize } from '../index.js';
import { MenuItem } from '../../models/MenuItem.js';
import { PlanMenuItem } from '../../models/PlanMenuItem.js';
import { Plan } from '../../models/Plan.js';

async function enableInvoiceMenuItem() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // 1. Update Invoice menu item to be unlocked
    const [affectedRows] = await MenuItem.update(
      {
        isLocked: false,
        requiresPlan: null // Remove plan requirement
      },
      {
        where: { key: 'invoice' }
      }
    );

    if (affectedRows > 0) {
      console.log('✅ Updated Invoice menu item: unlocked and removed plan requirement');
    } else {
      console.log('ℹ️  Invoice menu item not found or already updated');
    }

    // 2. Unlock Invoice for all plans in PlanMenuItem table
    try {
      const [planMenuItemRows] = await PlanMenuItem.update(
        { isLocked: false },
        {
          where: {
            menuItemId: sequelize.literal(`(SELECT id FROM menu_items WHERE \`key\` = 'invoice')`)
          }
        }
      );
      console.log(`✅ Unlocked Invoice menu item for ${planMenuItemRows} plan(s)`);
    } catch (pmError) {
      if (pmError.name === 'SequelizeDatabaseError' && pmError.message.includes('doesn\'t exist')) {
        console.log('ℹ️  PlanMenuItem table does not exist, skipping plan-specific unlock');
      } else {
        // Try alternative approach - get menu item ID first
        const invoiceMenuItem = await MenuItem.findOne({ where: { key: 'invoice' } });
        if (invoiceMenuItem) {
          const [planMenuItemRows] = await PlanMenuItem.update(
            { isLocked: false },
            { where: { menuItemId: invoiceMenuItem.id } }
          );
          console.log(`✅ Unlocked Invoice menu item for ${planMenuItemRows} plan(s)`);
        }
      }
    }

    // 3. Enable hasInvoice feature for all plans
    try {
      const [planRows] = await Plan.update(
        { hasInvoice: true },
        { where: {} }
      );
      console.log(`✅ Enabled hasInvoice feature for ${planRows} plan(s)`);
    } catch (planError) {
      console.log('ℹ️  Could not update plans (table may not exist or column may not exist):', planError.message);
    }

    console.log('\n✅ Invoice menu item enabled successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error enabling Invoice menu item:', error);
    process.exit(1);
  }
}

enableInvoiceMenuItem();

