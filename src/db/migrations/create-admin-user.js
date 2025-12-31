// src/db/migrations/create-admin-user.js
// Script to create an admin user or update existing user to admin role
import { User } from '../../models/User.js';
import { sequelize } from '../index.js';

async function createAdminUser() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'User';

    // Check if admin user already exists
    let adminUser = await User.findOne({ where: { email: adminEmail } });

    if (adminUser) {
      // Update existing user to admin role
      adminUser.role = 'admin';
      adminUser.status = 'active';
      if (adminPassword !== 'Admin@123') {
        // Only update password if it's not the default (to avoid overwriting custom passwords)
        adminUser.password = adminPassword;
      }
      await adminUser.save();
      console.log(`✅ Updated existing user "${adminEmail}" to admin role.`);
    } else {
      // Create new admin user
      adminUser = await User.create({
        firstName: adminFirstName,
        lastName: adminLastName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        status: 'active',
        phoneNo: '+911234567890'
      });
      console.log(`✅ Created new admin user: ${adminEmail}`);
    }

    console.log('\n📋 Admin User Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`Status: ${adminUser.status}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🌐 Admin Panel URL:');
    console.log(`   http://localhost:${process.env.PORT || 3002}/admin`);
    console.log(`   or`);
    console.log(`   ${process.env.PRODUCTION_URL || 'https://petserviceinhome.com'}/admin\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run if called directly
createAdminUser();

export { createAdminUser };

