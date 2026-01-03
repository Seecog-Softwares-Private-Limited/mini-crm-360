// src/db/migrations/create-plan-menu-items-table.js
import { sequelize } from '../index.js';
import { PlanMenuItem } from '../../models/PlanMenuItem.js';
import { Plan } from '../../models/Plan.js';
import { MenuItem } from '../../models/MenuItem.js';

async function createPlanMenuItemsTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Sync the model (creates table if it doesn't exist)
    await PlanMenuItem.sync({ alter: true });
    console.log('✅ Plan menu items table created/updated.');

    // Get all plans and menu items
    const plans = await Plan.findAll();
    const menuItems = await MenuItem.findAll();

    if (plans.length === 0) {
      console.log('⚠️  No plans found. Please create plans first.');
      process.exit(0);
    }

    if (menuItems.length === 0) {
      console.log('⚠️  No menu items found. Please run menu items migration first: npm run migrate:menu-items');
      process.exit(0);
    }

    console.log(`📋 Found ${plans.length} plans and ${menuItems.length} menu items.`);

    // Create default plan-menu-item relationships
    // By default, all menu items are unlocked for all plans
    let createdCount = 0;
    let skippedCount = 0;

    for (const plan of plans) {
      for (const menuItem of menuItems) {
        // Check if relationship already exists
        const existing = await PlanMenuItem.findOne({
          where: {
            planId: plan.id,
            menuItemId: menuItem.id
          }
        });

        if (!existing) {
          // Check if menu item requires a specific plan
          const requiresPlan = menuItem.requiresPlan;
          let isLocked = false;

          // If menu item requires a plan, lock it for plans below that requirement
          if (requiresPlan) {
            const planHierarchy = ['free-trial', 'free', 'silver', 'gold', 'enterprise'];
            const requiredIndex = planHierarchy.indexOf(requiresPlan);
            const planIndex = planHierarchy.indexOf(plan.slug);

            // Lock if plan is below required plan
            if (planIndex < requiredIndex) {
              isLocked = true;
            }
          }

          await PlanMenuItem.create({
            planId: plan.id,
            menuItemId: menuItem.id,
            isLocked: isLocked
          });
          createdCount++;
        } else {
          skippedCount++;
        }
      }
    }

    console.log(`✅ Created ${createdCount} plan-menu-item relationships.`);
    if (skippedCount > 0) {
      console.log(`ℹ️  Skipped ${skippedCount} existing relationships.`);
    }

    console.log('\n✅ Plan menu items migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating plan menu items table:', error);
    process.exit(1);
  }
}

createPlanMenuItemsTable();

