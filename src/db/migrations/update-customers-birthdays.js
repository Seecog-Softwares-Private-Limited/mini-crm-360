// src/db/migrations/update-customers-birthdays.js
// Script to update 10 customers with birthdays in the next 1 week

import { sequelize } from '../index.js';
import { Customer } from '../../models/Customer.js';

async function updateCustomersBirthdays() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get 10 customers (or all if less than 10)
    const customers = await Customer.findAll({
      limit: 10,
      order: sequelize.random() // Random order to get different customers each time
    });

    if (customers.length === 0) {
      console.log('⚠️  No customers found in the database.');
      process.exit(0);
    }

    console.log(`📋 Found ${customers.length} customers to update.`);

    // Update each customer with a birthday in the next 7 days
    const updates = [];
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      
      // Calculate birthday date (1 to 7 days from today, distributed evenly)
      const daysFromToday = (i % 7) + 1; // Cycle through 1-7 days
      const birthdayDate = new Date(today);
      birthdayDate.setDate(birthdayDate.getDate() + daysFromToday);
      
      // Set a random birth year (e.g., 20-60 years ago)
      const currentYear = today.getFullYear();
      const randomAge = Math.floor(Math.random() * 40) + 20; // Age between 20-60
      const birthYear = currentYear - randomAge;
      
      // Create the full dateOfBirth with the calculated year
      const dateOfBirth = new Date(birthYear, birthdayDate.getMonth(), birthdayDate.getDate());
      const dateOfBirthString = dateOfBirth.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      await customer.update({ dateOfBirth: dateOfBirthString });
      
      updates.push({
        id: customer.id,
        name: customer.name || 'Unnamed',
        dateOfBirth: dateOfBirthString,
        daysUntil: daysFromToday
      });

      console.log(`✅ Updated customer ${customer.id} (${customer.name || 'Unnamed'}) - Birthday: ${dateOfBirthString} (in ${daysFromToday} day${daysFromToday > 1 ? 's' : ''})`);
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Updated ${updates.length} customers with birthdays in the next 7 days:`);
    updates.forEach(update => {
      console.log(`   - Customer ${update.id}: ${update.name} → Birthday in ${update.daysUntil} day(s) (${update.dateOfBirth})`);
    });

    console.log('\n✅ Birthday update completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating customer birthdays:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

updateCustomersBirthdays();



import { sequelize } from '../index.js';
import { Customer } from '../../models/Customer.js';

async function updateCustomersBirthdays() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get 10 customers (or all if less than 10)
    const customers = await Customer.findAll({
      limit: 10,
      order: sequelize.random() // Random order to get different customers each time
    });

    if (customers.length === 0) {
      console.log('⚠️  No customers found in the database.');
      process.exit(0);
    }

    console.log(`📋 Found ${customers.length} customers to update.`);

    // Update each customer with a birthday in the next 7 days
    const updates = [];
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      
      // Calculate birthday date (1 to 7 days from today, distributed evenly)
      const daysFromToday = (i % 7) + 1; // Cycle through 1-7 days
      const birthdayDate = new Date(today);
      birthdayDate.setDate(birthdayDate.getDate() + daysFromToday);
      
      // Set a random birth year (e.g., 20-60 years ago)
      const currentYear = today.getFullYear();
      const randomAge = Math.floor(Math.random() * 40) + 20; // Age between 20-60
      const birthYear = currentYear - randomAge;
      
      // Create the full dateOfBirth with the calculated year
      const dateOfBirth = new Date(birthYear, birthdayDate.getMonth(), birthdayDate.getDate());
      const dateOfBirthString = dateOfBirth.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      await customer.update({ dateOfBirth: dateOfBirthString });
      
      updates.push({
        id: customer.id,
        name: customer.name || 'Unnamed',
        dateOfBirth: dateOfBirthString,
        daysUntil: daysFromToday
      });

      console.log(`✅ Updated customer ${customer.id} (${customer.name || 'Unnamed'}) - Birthday: ${dateOfBirthString} (in ${daysFromToday} day${daysFromToday > 1 ? 's' : ''})`);
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Updated ${updates.length} customers with birthdays in the next 7 days:`);
    updates.forEach(update => {
      console.log(`   - Customer ${update.id}: ${update.name} → Birthday in ${update.daysUntil} day(s) (${update.dateOfBirth})`);
    });

    console.log('\n✅ Birthday update completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating customer birthdays:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

updateCustomersBirthdays();

