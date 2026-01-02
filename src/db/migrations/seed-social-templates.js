// src/db/migrations/seed-social-templates.js
import { sequelize } from '../index.js';
import { SocialTemplate } from '../../models/SocialTemplate.js';

async function seedSocialTemplates() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Check if templates already exist
    const existingCount = await SocialTemplate.count({ where: { isSystem: true } });
    
    if (existingCount > 0) {
      console.log(`ℹ️  System templates already exist (${existingCount} templates). Skipping seed.`);
      process.exit(0);
    }

    const templates = [
      {
        name: 'Diwali Wishes',
        category: 'festival',
        content: '🎆 Wishing you and your family a very Happy Diwali! May this festival of lights bring joy, prosperity, and success to your life. May the divine light of Diwali illuminate your path and fill your home with happiness. 🪔✨ #Diwali #FestivalOfLights #HappyDiwali',
        tags: ['diwali', 'festival', 'wishes', 'india'],
        isSystem: true,
        isActive: true
      },
      {
        name: 'Holi Celebration',
        category: 'festival',
        content: '🌈 Happy Holi! May your life be filled with vibrant colors of joy, love, and happiness. Let\'s celebrate this festival of colors with enthusiasm and spread positivity everywhere. Have a colorful and joyful Holi! 🎨💐 #Holi #FestivalOfColors #HappyHoli',
        tags: ['holi', 'festival', 'colors', 'celebration'],
        isSystem: true,
        isActive: true
      },
      {
        name: 'New Year Greetings',
        category: 'festival',
        content: '🎉 Happy New Year! As we step into a new year, may it bring new opportunities, new adventures, and new achievements. Wishing you a year filled with success, happiness, and prosperity. Let\'s make this year amazing together! 🌟✨ #NewYear #HappyNewYear #NewBeginnings',
        tags: ['newyear', 'celebration', 'greetings', 'wishes'],
        isSystem: true,
        isActive: true
      },
      {
        name: 'Independence Day',
        category: 'festival',
        content: '🇮🇳 Happy Independence Day! Today we celebrate the freedom and unity of our nation. Let\'s remember the sacrifices of our heroes and work together to build a stronger, more prosperous India. Jai Hind! 🙏 #IndependenceDay #India #Freedom #Patriotism',
        tags: ['independence', 'india', 'patriotism', 'freedom'],
        isSystem: true,
        isActive: true
      },
      {
        name: 'Product Launch Announcement',
        category: 'promotion',
        content: '🚀 Exciting News! We\'re thrilled to announce the launch of our new product! Packed with amazing features that will revolutionize your experience. Stay tuned for more updates! #ProductLaunch #Innovation #NewProduct',
        tags: ['product', 'launch', 'announcement', 'business'],
        isSystem: true,
        isActive: true
      },
      {
        name: 'Sale Announcement',
        category: 'promotion',
        content: '🎊 Special Offer Alert! Don\'t miss out on our exclusive sale. Get amazing discounts on selected items. Limited time offer - shop now! 💰🛍️ #Sale #Discount #SpecialOffer #Shopping',
        tags: ['sale', 'discount', 'offer', 'promotion'],
        isSystem: true,
        isActive: true
      },
      {
        name: 'Thank You Message',
        category: 'general',
        content: '🙏 Thank you for your continued support! Your trust and loyalty mean the world to us. We\'re grateful to have you as part of our community. Looking forward to serving you better! ❤️ #ThankYou #Gratitude #CustomerAppreciation',
        tags: ['thankyou', 'gratitude', 'appreciation'],
        isSystem: true,
        isActive: true
      },
      {
        name: 'Business Hours Update',
        category: 'announcement',
        content: '📢 Important Update: Our business hours have changed. We\'re now open [NEW HOURS]. Visit us or contact us during these hours. Thank you for your understanding! #BusinessHours #Update #Announcement',
        tags: ['business', 'hours', 'update', 'announcement'],
        isSystem: true,
        isActive: true
      },
      {
        name: 'Customer Success Story',
        category: 'testimonial',
        content: '🌟 Success Story: We\'re proud to share how [Customer Name] achieved [Achievement] with our help. Their journey inspires us every day! Read their full story on our website. #SuccessStory #CustomerSuccess #Testimonial',
        tags: ['success', 'testimonial', 'customer', 'story'],
        isSystem: true,
        isActive: true
      },
      {
        name: 'Holiday Wishes',
        category: 'festival',
        content: '🎄 Wishing you a wonderful holiday season filled with joy, peace, and happiness! May this festive time bring you closer to your loved ones and create beautiful memories. Happy Holidays! 🎁✨ #Holidays #FestiveSeason #HappyHolidays',
        tags: ['holidays', 'festive', 'wishes', 'celebration'],
        isSystem: true,
        isActive: true
      }
    ];

    await SocialTemplate.bulkCreate(templates);
    console.log(`✅ Created ${templates.length} system templates.`);

    console.log('\n✅ Social templates seed completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding social templates:', error);
    process.exit(1);
  }
}

seedSocialTemplates();

