import { Business } from "../models/Business.js";
import { Customer } from "../models/Customer.js";
import { Template } from "../models/Template.js";
import EmailTemplate from "../models/EmailTemplate.js";
import { Campaign } from "../models/Campaign.js";

export const renderDashboard = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      console.error("Dashboard render error: User not authenticated");
      return res.status(401).redirect('/login');
    }

    const user = {
      firstName: req.user.firstName || '',
      lastName: req.user.lastName || '',
      plan: req.user.plan || null, // Include plan information
    };

    const userId = req.user.id;

    // auto-detect business
    const business = await Business.findOne({
      where: { ownerId: userId },
    });

    const businessId = business?.id;

    // ⚠️ If templates/campaigns don't have businessId column in DB, DON'T filter by businessId
    const whereCustomer = businessId ? { businessId, userId } : { userId };

    // Try to get counts with error handling for each
    let businessCount = 0;
    let customerCount = 0;
    let whatsappTemplateCount = 0;
    let emailTemplateCount = 0;
    let campaignCount = 0;
    let recentCustomers = [];

    try {
      businessCount = await Business.count({ where: { ownerId: userId } });
    } catch (e) {
      console.error("Error counting businesses:", e.message);
    }

    try {
      customerCount = await Customer.count({ where: whereCustomer });
    } catch (e) {
      console.error("Error counting customers:", e.message);
    }

    try {
      whatsappTemplateCount = await Template.count({ where: { userId } });
    } catch (e) {
      console.error("Error counting WhatsApp templates:", e.message);
    }

    try {
      emailTemplateCount = await EmailTemplate.count({ where: { deleted: false } });
    } catch (e) {
      console.error("Error counting email templates:", e.message);
      // If EmailTemplate table doesn't exist or has issues, set to 0
      emailTemplateCount = 0;
    }

    try {
      campaignCount = await Campaign.count({ where: { userId } });
    } catch (e) {
      console.error("Error counting campaigns:", e.message);
    }

    try {
      recentCustomers = await Customer.findAll({
        where: whereCustomer,
        order: [["createdAt", "DESC"]],
        limit: 5,
        include: [{ model: Business, as: "business", required: false }],
      });
    } catch (e) {
      console.error("Error fetching recent customers:", e.message);
      recentCustomers = [];
    }

    return res.render("dashboard", {
      title: "Dashboard",
      user,
      counts: {
        businesses: businessCount,
        customers: customerCount,
        whatsappTemplates: whatsappTemplateCount,
        emailTemplates: emailTemplateCount,
        campaigns: campaignCount,
        messages: 0,
        successRate: 0,
      },
      recentCustomers: recentCustomers || [],
    });
  } catch (err) {
    console.error("Dashboard render error:", err);
    console.error("Error stack:", err.stack);
    console.error("Error details:", {
      message: err.message,
      name: err.name,
      userId: req.user?.id,
    });
    return res.status(500).send(`Failed to load dashboard: ${err.message}`);
  }
};

// ✅ NEW API: counts only (for dashboard refreshCounts())
export const getDashboardCounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const business = await Business.findOne({ where: { ownerId: userId } });
    const businessId = business?.id;

    const whereCustomer = businessId ? { businessId, userId } : { userId };

    // Get counts with individual error handling
    let businesses = 0;
    let customers = 0;
    let whatsappTemplates = 0;
    let emailTemplates = 0;
    let campaigns = 0;

    try {
      businesses = await Business.count({ where: { ownerId: userId } });
    } catch (e) {
      console.error("Error counting businesses:", e.message);
    }

    try {
      customers = await Customer.count({ where: whereCustomer });
    } catch (e) {
      console.error("Error counting customers:", e.message);
    }

    try {
      whatsappTemplates = await Template.count({ where: { userId } });
    } catch (e) {
      console.error("Error counting WhatsApp templates:", e.message);
    }

    try {
      emailTemplates = await EmailTemplate.count({ where: { deleted: false } });
    } catch (e) {
      console.error("Error counting email templates:", e.message);
      emailTemplates = 0;
    }

    try {
      campaigns = await Campaign.count({ where: { userId } });
    } catch (e) {
      console.error("Error counting campaigns:", e.message);
    }

    return res.json({ businesses, customers, whatsappTemplates, emailTemplates, campaigns });
  } catch (err) {
    console.error("getDashboardCounts error:", err);
    console.error("Error stack:", err.stack);
    return res.status(500).json({ error: "Failed to load dashboard counts", message: err.message });
  }
};
