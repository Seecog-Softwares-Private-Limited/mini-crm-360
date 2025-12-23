// src/controllers/customer.controllers.js
import { Customer } from "../models/Customer.js";
import { Business } from "../models/Business.js";
import { Op } from 'sequelize';
import csv from 'csv-parser';

const isE164 = (v) => /^\+\d{8,15}$/.test(String(v || ""));
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ""));

/* ---------------- ADD CUSTOMER ---------------- */
export const addCustomer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phoneE164, whatsappE164, tags, consentAt, businessId } = req.body;

    // validations
    if (email && !isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!phoneE164 || !isE164(phoneE164)) {
      return res
        .status(400)
        .json({ error: "phoneE164 must be E.164 like +91xxxxxxxxxx" });
    }

    const wa = whatsappE164 ? whatsappE164 : phoneE164;
    if (wa && !isE164(wa)) {
      return res
        .status(400)
        .json({ error: "whatsappE164 must be E.164 like +91xxxxxxxxxx" });
    }

    // ✅ use selected businessId if provided, else auto-pick first business
    let biz = null;

    if (businessId) {
      biz = await Business.findOne({ where: { id: businessId, ownerId: userId } });
      if (!biz) return res.status(404).json({ error: "Business not found or not yours" });
    } else {
      biz = await Business.findOne({ where: { ownerId: userId } });
      if (!biz) {
        return res.status(400).json({ error: "Please create a business before adding customers" });
      }
    }

    // ✅ Because unique index is (userId, businessId, phoneE164), include all three
    const [customer, created] = await Customer.findOrCreate({
      where: { userId, businessId: biz.id, phoneE164 },
      defaults: {
        name: name || null,
        email: email || null,
        whatsappE164: wa,
        tags: Array.isArray(tags) ? tags : [],
        consentAt: consentAt ? new Date(consentAt) : new Date(),
      },
    });

    if (!created) {
      await customer.update({
        businessId: biz.id,
        name: name ?? customer.name,
        email: email ?? customer.email,
        whatsappE164: wa ?? customer.whatsappE164,
        tags: Array.isArray(tags) ? tags : customer.tags,
        consentAt: consentAt ? new Date(consentAt) : customer.consentAt,
      });
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
      if (!biz) return res.status(404).json({ error: "Business not found or not yours" });
      where.businessId = businessId;
    }

    if (tag) {
      // MySQL-safe JSON search (basic)
      where.tags = { [Op.like]: `%${tag}%` };
    }

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

    const { name, email, phoneE164, whatsappE164, tags, businessId } = req.body;

    if (email && !isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (phoneE164 && !isE164(phoneE164)) {
      return res.status(400).json({ error: "phoneE164 must be E.164 like +91xxxxxxxxxx" });
    }
    if (whatsappE164 && !isE164(whatsappE164)) {
      return res.status(400).json({ error: "whatsappE164 must be E.164 like +91xxxxxxxxxx" });
    }

    const customer = await Customer.findOne({ where: { id: customerId, userId } });
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // verify business ownership if businessId changing
    if (businessId && String(businessId) !== String(customer.businessId)) {
      const biz = await Business.findOne({ where: { id: businessId, ownerId: userId } });
      if (!biz) return res.status(404).json({ error: "Business not found or not yours" });
    }

    // ✅ update all fields correctly
    await customer.update({
      name: name ?? customer.name,
      email: email ?? customer.email,
      phoneE164: phoneE164 ?? customer.phoneE164,
      whatsappE164: whatsappE164 ?? customer.whatsappE164,
      tags: Array.isArray(tags) ? tags : customer.tags,
      businessId: businessId ?? customer.businessId,
    });

    return res.json(customer);
  } catch (e) {
    console.error("updateCustomer error:", e);
    return res.status(500).json({ error: e.message });
  }
};

/* ---------------- DELETE CUSTOMER ---------------- */
export const deleteCustomer = async (req, res) => {
  try {
    const userId = req.user.id;
    const customerId = req.params.id;

    const customer = await Customer.findOne({ where: { id: customerId, userId } });
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    await customer.destroy();
    return res.json({ message: "Customer deleted successfully" });
  } catch (e) {
    console.error("deleteCustomer error:", e);
    return res.status(500).json({ error: e.message });
  }
};

export const bulkUploadCustomers = async (req, res) => {
    const userId = req.user.id;
    const { businessId } = req.body;

    // Validate file upload
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    if (!businessId) {
        return res.status(400).json({ error: "businessId is required" });
    }

    try {
        // Verify business ownership
        const business = await Business.findOne({
            where: { id: businessId, ownerId: userId }
        });
        if (!business) {
            return res.status(404).json({ error: "Business not found or not yours" });
        }

        const rows = [];
        const errors = [];

        // Parse CSV file
        req.file.buffer.toString()
            .split('\n')
            .forEach((line, index) => {
                if (index === 0 || !line.trim()) return; // Skip header and empty lines
                const [name, phoneE164, tags, consentAt] = line.split(',').map(v => v.trim());
                
                // Validate phone format
                if (!phoneE164 || !/^\+\d{8,15}$/.test(phoneE164)) {
                    errors.push({
                        row: index + 1,
                        error: `Invalid phone format: ${phoneE164}. Must be in E.164 format like +91xxxxxxxxxx`
                    });
                    return;
                }

                rows.push({
                    userId,
                    businessId,
                    name: name || null,
                    phoneE164,
                    tags: tags ? tags.split(';').map(t => t.trim()) : [],
                    consentAt: consentAt ? new Date(consentAt) : new Date()
                });
            });

        console.log('CSV parsed - rows:', rows.length, 'errors:', errors.length);

        // If there are validation errors, return them
        if (errors.length > 0 && rows.length === 0) {
            return res.status(400).json({
                error: "CSV validation failed",
                details: errors
            });
        }

        // Bulk create customers (skip duplicates)
        const createdCustomers = [];
        let skipped = 0;

        console.log('Starting bulk insert for', rows.length, 'rows');

        for (const customerData of rows) {
            try {
                console.log('Processing customer:', customerData.phoneE164);
                const [doc, created] = await Customer.findOrCreate({
                    where: {
                        businessId: customerData.businessId,
                        phoneE164: customerData.phoneE164,
                        userId: customerData.userId
                    },
                    defaults: customerData
                });

                if (created) {
                    createdCustomers.push(doc);
                    console.log('Created new customer:', doc.phoneE164);
                } else {
                    skipped++;
                    console.log('Updated existing customer:', doc.phoneE164);
                    // Optionally update existing customer
                    await doc.update({
                        name: customerData.name ?? doc.name,
                        tags: customerData.tags.length > 0 ? customerData.tags : doc.tags,
                        consentAt: customerData.consentAt ?? doc.consentAt
                    });
                }
            } catch (e) {
                console.error('Error processing customer:', customerData.phoneE164, '- Error:', e.message);
                if (e.errors) {
                    console.error('Validation errors:', e.errors.map(err => err.message).join(', '));
                }
                errors.push({
                    phone: customerData.phoneE164,
                    error: e.message
                });
            }
        }

        console.log('Bulk insert complete - created:', createdCustomers.length, 'skipped:', skipped);

        res.status(201).json({
            success: true,
            message: "Bulk upload completed",
            created: createdCustomers.length,
            skipped,
            errors: errors.length > 0 ? errors : undefined,
            customers: createdCustomers
        });

    } catch (e) {
        console.error('Bulk upload error:', e);
        res.status(500).json({ error: "Failed to process bulk upload", details: e.message });
    }
};
