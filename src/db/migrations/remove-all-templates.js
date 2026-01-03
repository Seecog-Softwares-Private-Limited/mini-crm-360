// src/db/migrations/remove-all-templates.js
// Migration script to remove all message templates data
import { sequelize } from '../index.js';
import { Template } from '../../models/Template.js';
import EmailTemplate from '../../models/EmailTemplate.js';
import { SocialTemplate } from '../../models/SocialTemplate.js';

async function removeAllTemplates() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Delete all WhatsApp templates
    const whatsappDeleted = await Template.destroy({
      where: {},
      force: true // Hard delete
    });
    console.log(`✅ Deleted ${whatsappDeleted} WhatsApp template(s)`);

    // Delete all Email templates
    const emailDeleted = await EmailTemplate.destroy({
      where: {},
      force: true // Hard delete
    });
    console.log(`✅ Deleted ${emailDeleted} Email template(s)`);

    // Delete all Social templates
    const socialDeleted = await SocialTemplate.destroy({
      where: {},
      force: true // Hard delete
    });
    console.log(`✅ Deleted ${socialDeleted} Social template(s)`);

    console.log(`\n📊 Summary:`);
    console.log(`   - WhatsApp Templates: ${whatsappDeleted} deleted`);
    console.log(`   - Email Templates: ${emailDeleted} deleted`);
    console.log(`   - Social Templates: ${socialDeleted} deleted`);
    console.log(`   - Total Templates Removed: ${whatsappDeleted + emailDeleted + socialDeleted}`);

    console.log('\n✅ All message templates data removed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing templates:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

removeAllTemplates();

