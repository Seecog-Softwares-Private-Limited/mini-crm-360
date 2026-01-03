// Script to update at least 10 customers to have birthdays in the current week
// Usage: node src/db/migrations/update-customers-birthdays-this-week.js

import { sequelize } from '../index.js';
import { Customer } from '../../models/Customer.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Fetch 10 random customers
    const customers = await Customer.findAll({
      order: sequelize.random(),
      limit: 10,
      attributes: ['id', 'name', 'dateOfBirth'],
    });

    if (!customers.length) {
      console.log('No customers found to update.');
      process.exit(0);
    }

    const now = new Date();
    // Set birthdays in the NEXT week (7 days from today)
    const startOfNextWeek = new Date(now);
    startOfNextWeek.setDate(now.getDate() + 7); // Start 7 days from today
    startOfNextWeek.setHours(0, 0, 0, 0);

    const updates = [];

    customers.forEach((customer, idx) => {
      const targetDate = new Date(startOfNextWeek);
      targetDate.setDate(startOfNextWeek.getDate() + (idx % 7)); // distribute across the next week (7 days)

      // Use a fixed year for realism (1985-2000 range)
      const birthYear = 1985 + (idx % 15);
      const dob = `${birthYear}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

      updates.push(customer.update({ dateOfBirth: dob }));
      console.log(`Will update customer ${customer.id} (${customer.name || 'Unnamed'}) -> DOB ${dob}`);
    });

    await Promise.all(updates);
    console.log(`✅ Updated ${customers.length} customers with birthdays in the current week.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to update customer birthdays:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();

