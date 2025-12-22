import { Business } from "../models/Business.js";
import { Customer } from "../models/Customer.js";
import { Template } from "../models/Template.js";
import { Campaign } from "../models/Campaign.js";

export const renderDashboard = async (req, res) => {
  try {
    const user = {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
    };

    const userId = req.user.id;

    // auto-detect business
    const business = await Business.findOne({
      where: { ownerId: userId },
    });

    const businessId = business?.id;

    // ⚠️ If templates/campaigns don't have businessId column in DB, DON'T filter by businessId
    const whereCustomer = businessId ? { businessId, userId } : { userId };

    const [businessCount, customerCount, templateCount, campaignCount, recentCustomers] =
      await Promise.all([
        Business.count({ where: { ownerId: userId } }),
        Customer.count({ where: whereCustomer }),

        // ✅ safest filter (only by userId)
        Template.count({ where: { userId } }),
        Campaign.count({ where: { userId } }),

        Customer.findAll({
          where: whereCustomer,
          order: [["createdAt", "DESC"]],
          limit: 5,
          include: [{ model: Business, as: "business" }],
        }),
      ]);

    return res.render("dashboard", {
      title: "Dashboard",
      user,
      counts: {
        businesses: businessCount,
        customers: customerCount,
        templates: templateCount,
        campaigns: campaignCount,
        messages: 0,
        successRate: 0,
      },
      recentCustomers,
    });
  } catch (err) {
    console.error("Dashboard render error:", err);
    return res.status(500).send("Failed to load dashboard");
  }
};

// ✅ NEW API: counts only (for dashboard refreshCounts())
export const getDashboardCounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const business = await Business.findOne({ where: { ownerId: userId } });
    const businessId = business?.id;

    const whereCustomer = businessId ? { businessId, userId } : { userId };

    const [businesses, customers, templates, campaigns] = await Promise.all([
      Business.count({ where: { ownerId: userId } }),
      Customer.count({ where: whereCustomer }),

      // ✅ safest filter (only by userId)
      Template.count({ where: { userId } }),
      Campaign.count({ where: { userId } }),
    ]);

    return res.json({ businesses, customers, templates, campaigns });
  } catch (err) {
    console.error("getDashboardCounts error:", err);
    return res.status(500).json({ error: "Failed to load dashboard counts" });
  }
};
