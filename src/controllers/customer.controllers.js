// controllers/customer.controllers.js
import { Customer } from "../models/Customer.js";
import { Business } from "../models/Business.js";
import { Op } from "sequelize";

/* ---------------- ADD CUSTOMER ---------------- */
export const addCustomer = async (req, res) => {
  try {
    const userId = req.user.id;
     const { name, phoneE164, whatsappE164, tags, consentAt } = req.body;

    if (!phoneE164 || !/^\+\d{8,15}$/.test(phoneE164)) {
      return res.status(400).json({
        error: "phoneE164 must be in E.164 format like +91xxxxxxxxxx",
      });
    }

       let wa = whatsappE164 || phoneE164;
    if (wa && !/^\+\d{8,15}$/.test(wa)) {
      return res.status(400).json({
        error: "whatsappE164 must be E.164 like +91xxxxxxxxxx",
      });
    }

    // 🔥 Auto-detect business
    const business = await Business.findOne({
      where: { ownerId: userId },
    });

    if (!business) {
      return res.status(400).json({
        error: "Please create a business before adding customers",
      });
    }

    const [customer, created] = await Customer.findOrCreate({
      where: {
        userId,
        businessId: business.id,
        phoneE164,
      },
      defaults: {
        name: name || null,
          whatsappE164: wa, // ✅ here
        tags: Array.isArray(tags) ? tags : [],
        consentAt: consentAt ? new Date(consentAt) : new Date(),
      },
    });

    if (!created) {
      customer.name = name ?? customer.name;
      if (Array.isArray(tags)) customer.tags = tags;
      await customer.save();
    }

    return res.status(201).json(customer);
  } catch (e) {
    console.error("addCustomer error:", e);
    return res.status(500).json({ error: e.message });
  }
};

/* ---------------- LIST CUSTOMERS ---------------- */
export const listCustomers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tag, businessId } = req.query;

    const where = { userId };

    if (businessId) {
      const biz = await Business.findOne({
        where: { id: businessId, ownerId: userId },
      });
      if (!biz)
        return res
          .status(404)
          .json({ error: "Business not found or not yours" });

      where.businessId = businessId;
    }

    if (tag) {
      // ✅ MySQL-safe
      where.tags = {
        [Op.like]: `%${tag}%`,
      };
    }

   // ✅ add this before findAll
const limit = Math.min(parseInt(req.query.limit || "200", 10), 200);

const rows = await Customer.findAll({
  where,
  include: [
    {
      model: Business,
      as: "business",
      attributes: ["id", "businessName", "category"],
    },
  ],
  order: [["createdAt", "DESC"]],
  limit,
});


    return res.json(rows);
  } catch (e) {
    console.error("listCustomers error:", e);
    return res.status(500).json({ error: "Failed to load customers" });
  }
};

/* ---------------- UPDATE CUSTOMER ---------------- */
export const updateCustomer = async (req, res) => {
  try {
    const userId = req.user.id;
    const customerId = req.params.id;
   const { name, phoneE164, whatsappE164, tags, businessId } = req.body;

    if (phoneE164 && !/^\+\d{8,15}$/.test(phoneE164)) {
      return res.status(400).json({
        error: "phoneE164 must be in E.164 format like +91xxxxxxxxxx",
      });
    }
    if (whatsappE164 && !/^\+\d{8,15}$/.test(whatsappE164)) {
  return res.status(400).json({ error: "whatsappE164 must be E.164 like +91xxxxxxxxxx" });
}

await customer.update({
  name: name ?? customer.name,
  phoneE164: phoneE164 ?? customer.phoneE164,
  whatsappE164: whatsappE164 ?? customer.whatsappE164, // ✅ new
  tags: Array.isArray(tags) ? tags : customer.tags,
  businessId: businessId ?? customer.businessId,
});

    const customer = await Customer.findOne({
      where: { id: customerId, userId },
    });

    if (!customer)
      return res.status(404).json({ error: "Customer not found" });

    if (businessId && businessId !== customer.businessId) {
      const biz = await Business.findOne({
        where: { id: businessId, ownerId: userId },
      });
      if (!biz)
        return res
          .status(404)
          .json({ error: "Business not found or not yours" });
    }

    await customer.update({
      name: name ?? customer.name,
      phoneE164: phoneE164 ?? customer.phoneE164,
      tags: Array.isArray(tags) ? tags : customer.tags,
      businessId: businessId ?? customer.businessId,
    });

    return res.json(customer);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

/* ---------------- DELETE CUSTOMER ---------------- */
export const deleteCustomer = async (req, res) => {
  try {
    const userId = req.user.id;
    const customerId = req.params.id;

    const customer = await Customer.findOne({
      where: { id: customerId, userId },
    });

    if (!customer)
      return res.status(404).json({ error: "Customer not found" });

    await customer.destroy();
    return res.json({ message: "Customer deleted successfully" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
