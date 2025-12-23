// src/controllers/customer.controllers.js
import { Customer } from "../models/Customer.js";
import { Business } from "../models/Business.js";
import { Op } from 'sequelize';
import csv from 'csv-parser';
import { PassThrough } from 'stream';
import { sendDocumentEmail } from "../utils/emailService.js";
import { autoLogEvent } from "./note.controller.js";

const isE164 = (v) => /^\+\d{8,15}$/.test(String(v || ""));
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ""));

// Validate phone number (accepts 10 digits or E.164 format)
const is10DigitPhone = (v) => {
    if (!v) return false;
    const str = String(v).trim();
    
    // If already in E.164 format, extract digits and check
    if (str.startsWith('+')) {
        const digits = str.replace(/\D/g, '');
        // E.164 format: + followed by country code + number
        // For India (+91), we expect 12 digits total (91 + 10 digits)
        // Or just check if it's a valid E.164 format
        return digits.length >= 10 && digits.length <= 15;
    }
    
    // Check for 10-digit number
    const digits = str.replace(/\D/g, '');
    return digits.length === 10;
};

// Convert phone number to E.164 format
// Accepts: 10-digit number, +91xxxxxxxxxx, or already formatted E.164
const toE164 = (v) => {
    if (!v) return null;
    const digits = String(v).replace(/\D/g, '');
    if (!digits) return null;
    
    // If already in E.164 format, return as is
    if (String(v).startsWith('+')) {
        return String(v);
    }
    
    // If starts with 91 and has 12 digits, add +
    if (digits.startsWith('91') && digits.length === 12) {
        return '+' + digits;
    }
    
    // If 10 digits, assume India (+91)
    if (digits.length === 10) {
        return '+91' + digits;
    }
    
    // If 11 digits starting with 0, remove 0 and add +91
    if (digits.length === 11 && digits.startsWith('0')) {
        return '+91' + digits.slice(1);
    }
    
    // Return as is if it doesn't match patterns (let database validation handle it)
    return '+' + digits;
};

/* ---------------- ADD CUSTOMER ---------------- */
export const addCustomer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phoneE164, whatsappE164, tags, consentAt, businessId } = req.body;

    // validations
    if (email && !isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate 10-digit phone number
    if (!phoneE164 || !is10DigitPhone(phoneE164)) {
      return res
        .status(400)
        .json({ error: "phoneE164 must be a 10-digit number" });
    }

    // Convert to E.164 format for storage
    const phoneE164Formatted = toE164(phoneE164);
    const wa = whatsappE164 ? (is10DigitPhone(whatsappE164) ? toE164(whatsappE164) : whatsappE164) : phoneE164Formatted;
    
    if (whatsappE164 && !is10DigitPhone(whatsappE164)) {
      return res
        .status(400)
        .json({ error: "whatsappE164 must be a 10-digit number" });
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
      
      // Auto-log customer update event
      await autoLogEvent(
        userId,
        customer.id,
        'customer_updated',
        'Customer Updated',
        `Customer information updated`,
        { customerId: customer.id }
      );
    } else {
      // Auto-log customer creation event
      await autoLogEvent(
        userId,
        customer.id,
        'customer_created',
        'Customer Created',
        `New customer "${name || 'Unnamed'}" added`,
        { customerId: customer.id }
      );
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
    const { 
      tag, 
      businessId, 
      search, 
      page = 1, 
      pageSize = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'DESC' 
    } = req.query;

    console.log('═══════════════════════════════════════');
    console.log('LIST CUSTOMERS REQUEST');
    console.log('═══════════════════════════════════════');
    console.log('UserId:', userId);
    console.log('Query params:', { tag, businessId, search, page, pageSize, sortBy, sortOrder });

    // Build where clause properly
    const whereConditions = [{ userId }];

    // If businessId filter is provided, validate and apply it
    if (businessId) {
      try {
        const biz = await Business.findOne({
          where: { id: businessId, ownerId: userId },
        });
        if (!biz) {
          console.log('❌ Business not found or not owned by user');
          return res.status(404).json({ error: "Business not found or not yours" });
        }
        whereConditions.push({ businessId });
        console.log('✅ Filtering by businessId:', businessId);
      } catch (bizErr) {
        console.error('Error checking business:', bizErr);
        return res.status(500).json({ error: "Failed to validate business", message: bizErr.message });
      }
    } else {
      // If no businessId filter, show all customers for this user (with or without businessId)
      console.log('✅ Showing all customers for user (no businessId filter)');
    }

    if (tag) {
      // MySQL-safe JSON search (basic)
      whereConditions.push({ tags: { [Op.like]: `%${tag}%` } });
    }

    // Search functionality - combine with userId using Op.and
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereConditions.push({
        [Op.or]: [
          { name: { [Op.like]: searchTerm } },
          { email: { [Op.like]: searchTerm } },
          { phoneE164: { [Op.like]: searchTerm } },
          { whatsappE164: { [Op.like]: searchTerm } }
        ]
      });
    }

    // Combine all conditions with Op.and (only if multiple conditions)
    let where;
    if (whereConditions.length === 1) {
      where = whereConditions[0];
    } else if (whereConditions.length > 1) {
      where = { [Op.and]: whereConditions };
    } else {
      where = {};
    }
    
    console.log('Where clause:', JSON.stringify(where, null, 2));

    // Pagination
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const size = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 100); // Max 100 per page
    const offset = (pageNum - 1) * size;

    // Sorting
    const validSortFields = ['name', 'email', 'phoneE164', 'whatsappE164', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count for pagination
    const totalCount = await Customer.count({ where });
    console.log('Total customers matching filter:', totalCount);

    // Get paginated results
    const { rows, count } = await Customer.findAndCountAll({
      where,
      include: [
        {
          model: Business,
          as: "business",
          attributes: ["id", "businessName", "category"],
          required: false // LEFT JOIN - include customers even if business is null
        },
      ],
      order: [[sortField, orderDirection]],
      limit: size,
      offset: offset,
    });

    console.log('Customers found:', rows.length);
    console.log('Sample customer:', rows.length > 0 ? {
      id: rows[0].id,
      name: rows[0].name,
      businessId: rows[0].businessId,
      userId: rows[0].userId
    } : 'No customers');

    const totalPages = Math.ceil(totalCount / size);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page: pageNum,
        pageSize: size,
        totalCount,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      },
      filters: {
        search: search || null,
        tag: tag || null,
        businessId: businessId || null,
        sortBy: sortField,
        sortOrder: orderDirection
      }
    });
  } catch (e) {
    console.error("═══════════════════════════════════════");
    console.error("❌ LIST CUSTOMERS ERROR");
    console.error("═══════════════════════════════════════");
    console.error("Error message:", e.message);
    console.error("Error name:", e.name);
    console.error("Error stack:", e.stack);
    console.error("User ID:", req.user?.id);
    console.error("Query params:", req.query);
    console.error("═══════════════════════════════════════");
    return res.status(500).json({ 
      error: "Failed to load customers", 
      message: e.message,
      details: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
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

    const customer = await Customer.findOne({ where: { id: customerId, userId } });
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // Validate 10-digit phone number if provided
    let phoneE164Formatted = customer.phoneE164;
    if (phoneE164) {
      if (!is10DigitPhone(phoneE164)) {
        return res.status(400).json({ error: "phoneE164 must be a 10-digit number" });
      }
      phoneE164Formatted = toE164(phoneE164);
    }
    
    let whatsappE164Formatted = customer.whatsappE164;
    if (whatsappE164) {
      if (!is10DigitPhone(whatsappE164)) {
        return res.status(400).json({ error: "whatsappE164 must be a 10-digit number" });
      }
      whatsappE164Formatted = toE164(whatsappE164);
    }

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

export const sendEmailToCustomer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { customerId, to, subject, html } = req.body;

    if (!customerId || !to || !subject || !html) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        message: "customerId, to, subject, and html are required" 
      });
    }

    // Verify customer belongs to user
    const customer = await Customer.findOne({ 
      where: { id: customerId, userId } 
    });

    if (!customer) {
      return res.status(404).json({ 
        error: "Customer not found", 
        message: "Customer does not exist or does not belong to you" 
      });
    }

    // Verify customer has an email address
    if (!customer.email) {
      return res.status(400).json({ 
        error: "Customer has no email", 
        message: "Customer does not have an email address" 
      });
    }

    // Verify email matches customer email (extract email from "Name <email>" format)
    const emailMatch = to.match(/<(.+)>/);
    const emailAddress = emailMatch ? emailMatch[1] : to;
    const customerEmail = customer.email;
    
    if (customerEmail.toLowerCase() !== emailAddress.toLowerCase()) {
      return res.status(400).json({ 
        error: "Email mismatch", 
        message: "Email address does not match customer's email" 
      });
    }

    // Ensure HTML is a string and not corrupted
    const htmlContent = String(html || '').trim();
    
    if (!htmlContent) {
      return res.status(400).json({ 
        error: "Invalid HTML content", 
        message: "HTML content is required and cannot be empty" 
      });
    }

    // Send email (reuse emailAddress already extracted above)
    const emailSent = await sendDocumentEmail({
      to: emailAddress,
      subject: String(subject || '').trim(),
      html: htmlContent
    });

    if (emailSent) {
      // Auto-log individual email sent event
      await autoLogEvent(
        userId,
        customerId,
        'email_sent',
        'Email Sent',
        `Email sent: ${subject}`,
        { to: emailAddress, subject }
      );

      return res.json({ 
        success: true, 
        message: "Email sent successfully" 
      });
    } else {
      return res.status(500).json({ 
        error: "Failed to send email", 
        message: "Email service returned an error" 
      });
    }
  } catch (e) {
    console.error("Error sending email to customer:", e);
    return res.status(500).json({ 
      error: "Failed to send email", 
      message: e.message 
    });
  }
};

export const bulkUploadCustomers = async (req, res) => {
    const userId = req.user.id;

    // Validate file upload
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        // Get business associated with the user (ownerId)
        // Fetch the first business owned by this user (ordered by creation date)
        let business = await Business.findOne({
            where: { ownerId: userId },
            order: [['createdAt', 'ASC']] // Get the oldest/first business
        });

        // If no business exists, create a default one automatically
        if (!business) {
            console.log('⚠️ No business found for user (ownerId:', userId + '), creating default business...');
            
            // Get user info for default business name
            const user = req.user;
            const defaultBusinessName = user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}'s Business`
                : user.email 
                    ? `${user.email.split('@')[0]}'s Business`
                    : `Business ${userId}`;

            // Create default business
            business = await Business.create({
                businessName: defaultBusinessName,
                ownerId: userId,
                country: 'India', // Default country
                category: 'General', // Default category
                timezone: 'Asia/Kolkata', // Default timezone
                description: 'Auto-created business for customer management'
            });

            console.log('✅ Created default business:', business.id, business.businessName);
        }

        const businessId = business.id;
        console.log('═══════════════════════════════════════');
        console.log('✅ BUSINESS FOUND/CREATED FOR BULK UPLOAD');
        console.log('═══════════════════════════════════════');
        console.log('Business ID:', businessId);
        console.log('Business Name:', business.businessName);
        console.log('Owner ID (userId):', business.ownerId);
        console.log('User ID (from req.user):', userId);
        console.log('✅ All customers will be associated with this business');
        console.log('═══════════════════════════════════════');

        const rows = [];
        const errors = [];
        let headerRow = null;
        let rowIndex = 0;

        // Parse CSV file using csv-parser
        return new Promise((resolve, reject) => {
            const bufferStream = new PassThrough();
            bufferStream.end(req.file.buffer);

            bufferStream
                .pipe(csv())
                .on('headers', (headers) => {
                    headerRow = headers.map(h => h.trim().toLowerCase());
                    console.log('═══════════════════════════════════════');
                    console.log('CSV HEADERS DETECTED');
                    console.log('═══════════════════════════════════════');
                    console.log('Raw headers:', headers);
                    console.log('Normalized headers:', headerRow);
                    
                    // Validate required columns exist
                    const requiredColumns = ['name', 'phonee164'];
                    const missingColumns = requiredColumns.filter(col => !headerRow.includes(col));
                    
                    console.log('Required columns:', requiredColumns);
                    console.log('Missing columns:', missingColumns);
                    
                    if (missingColumns.length > 0) {
                        console.log('❌ Missing required columns, aborting');
                        bufferStream.destroy();
                        return resolve(res.status(400).json({
                            error: "CSV validation failed",
                            message: `Required columns missing: ${missingColumns.join(', ')}`,
                            details: `Found columns: ${headerRow.join(', ')}. Required columns: ${requiredColumns.join(', ')}`
                        }));
                    }
                    console.log('✅ All required columns found');
                })
                .on('data', (data) => {
                    rowIndex++;
                    const rowNum = rowIndex + 1; // +1 for header row
                    
                    // Map columns (case-insensitive)
                    const name = data.name || data.Name || data.NAME || null;
                    const phoneE164 = data.phonee164 || data.phoneE164 || data.PhoneE164 || data.PHONEE164 || null;
                    const email = data.email || data.Email || data.EMAIL || null;
                    const whatsappE164 = data.whatsappe164 || data.whatsappE164 || data.WhatsappE164 || data.WHATSAPPE164 || null;
                    const tags = data.tags || data.Tags || data.TAGS || null;
                    const consentAt = data.consentat || data.consentAt || data.ConsentAt || data.CONSENTAT || null;

                    // Validate required fields
                    if (!phoneE164) {
                        errors.push({
                            row: rowNum,
                            error: `Missing required column: phoneE164`
                        });
                        return;
                    }

                    // Validate phone format (10 digits or E.164)
                    if (!is10DigitPhone(phoneE164)) {
                        errors.push({
                            row: rowNum,
                            error: `Invalid phone format: ${phoneE164}. Must be a 10-digit number or E.164 format (e.g., +919999999999)`
                        });
                        return;
                    }

                    // Convert to E.164 format (handles both 10-digit and already formatted)
                    const phoneE164Formatted = toE164(phoneE164);
                    console.log(`Row ${rowNum}: Converted ${phoneE164} -> ${phoneE164Formatted}`);

                    // Validate email if provided
                    if (email && !isEmail(email)) {
                        errors.push({
                            row: rowNum,
                            error: `Invalid email format: ${email}`
                        });
                        return;
                    }

                    // Validate WhatsApp if provided (10 digits)
                    let whatsappE164Formatted = null;
                    if (whatsappE164) {
                        if (!is10DigitPhone(whatsappE164)) {
                            errors.push({
                                row: rowNum,
                                error: `Invalid WhatsApp format: ${whatsappE164}. Must be a 10-digit number`
                            });
                            return;
                        }
                        whatsappE164Formatted = toE164(whatsappE164);
                    }

                    // Prepare customer data
                    // Always use the businessId from the fetched business (ownerId)
                    const customerData = {
                        userId,
                        businessId: businessId, // Always set from owner's business
                        name: name || null,
                        email: email || null,
                        phoneE164: phoneE164Formatted,
                        whatsappE164: whatsappE164Formatted || phoneE164Formatted,
                        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                        consentAt: consentAt ? new Date(consentAt) : new Date()
                    };
                    
                    console.log(`Row ${rowNum}: Customer data prepared with businessId: ${businessId}`);
                    rows.push(customerData);
                })
                .on('end', () => {
                    console.log('═══════════════════════════════════════');
                    console.log('CSV PARSING COMPLETE');
                    console.log('═══════════════════════════════════════');
                    console.log('Total rows parsed:', rows.length);
                    console.log('Validation errors:', errors.length);
                    console.log('UserId:', userId);
                    console.log('BusinessId:', businessId);
                    
                    if (rows.length > 0) {
                        console.log('Sample row data:', JSON.stringify(rows[0], null, 2));
                    }
                    
                    if (errors.length > 0) {
                        console.log('Sample errors:', errors.slice(0, 3));
                    }

                    // If there are validation errors and no valid rows, return them
                    if (errors.length > 0 && rows.length === 0) {
                        console.log('❌ All rows failed validation');
                        return resolve(res.status(400).json({
                            error: "CSV validation failed",
                            message: "All rows have validation errors",
                            details: errors
                        }));
                    }

                    // If no rows to process, return error
                    if (rows.length === 0) {
                        console.log('❌ No valid rows found');
                        return resolve(res.status(400).json({
                            error: "No valid rows found",
                            message: "CSV file appears to be empty or all rows were skipped",
                            validationErrors: errors.length > 0 ? errors : undefined
                        }));
                    }

                    console.log('✅ Proceeding with bulk insert...');
                    // Continue with bulk insert
                    processBulkInsert(rows, errors, userId, businessId, res, resolve).catch(err => {
                        console.error('❌ processBulkInsert error:', err);
                        return resolve(res.status(500).json({
                            error: "Failed to insert customers",
                            message: err.message
                        }));
                    });
                })
                .on('error', (err) => {
                    console.error('CSV parsing error:', err);
                    return resolve(res.status(400).json({
                        error: "Failed to parse CSV file",
                        message: err.message
                    }));
                });
        });
    } catch (e) {
        console.error('Bulk upload error:', e);
        return res.status(500).json({ error: "Failed to process bulk upload", details: e.message });
    }
};

async function processBulkInsert(rows, errors, userId, businessId, res, resolve) {
    console.log('═══════════════════════════════════════');
    console.log('STARTING BULK INSERT');
    console.log('═══════════════════════════════════════');
    console.log('Rows to process:', rows.length);
    console.log('Existing errors:', errors.length);
    console.log('UserId:', userId);
    console.log('BusinessId (from ownerId):', businessId);

    // Validate businessId - it should always be present (fetched from owner's business)
    if (!businessId) {
        console.error('❌ ERROR: businessId is null/undefined. Cannot proceed with bulk insert.');
        return resolve(res.status(500).json({
            error: "Business ID missing",
            message: "Business ID is required for bulk customer upload. Please ensure you have a business associated with your account."
        }));
    }

    const validBusinessId = businessId;
    console.log('✅ Using businessId for all customers:', validBusinessId);
    console.log('✅ All customers will be associated with business ID:', validBusinessId);

    // Bulk create customers (skip duplicates)
    const createdCustomers = [];
    let skipped = 0;

    for (const customerData of rows) {
        try {
            console.log('Processing customer:', customerData.phoneE164);
            
            // Ensure businessId is always set from owner's business (override any CSV value)
            const finalCustomerData = {
                ...customerData,
                businessId: validBusinessId // Always use owner's businessId
            };
            
            console.log('Final customer data:', JSON.stringify(finalCustomerData, null, 2));
            
            // Use unique index fields (userId, phoneE164) for findOrCreate
            // This matches the UNIQUE KEY `customers_user_id_phone_e164` (`userId`,`phoneE164`)
            const [doc, created] = await Customer.findOrCreate({
                where: {
                    userId: finalCustomerData.userId,
                    phoneE164: finalCustomerData.phoneE164
                },
                defaults: finalCustomerData
            });
            
            console.log('findOrCreate result - created:', created, 'doc.id:', doc?.id, 'doc.phoneE164:', doc?.phoneE164);

            if (created) {
                createdCustomers.push(doc);
                console.log('✅ Created new customer:', doc.id, doc.phoneE164);
            } else {
                skipped++;
                console.log('⚠️ Customer already exists:', doc.id, doc.phoneE164);
                // Update existing customer with new data
                await doc.update({
                    name: customerData.name ?? doc.name,
                    email: customerData.email ?? doc.email,
                    whatsappE164: customerData.whatsappE164 ?? doc.whatsappE164,
                    businessId: customerData.businessId ?? doc.businessId,
                    tags: customerData.tags.length > 0 ? customerData.tags : doc.tags,
                    consentAt: customerData.consentAt ?? doc.consentAt
                });
                console.log('✅ Updated existing customer:', doc.id);
            }
        } catch (e) {
            console.error('❌ Error processing customer:', customerData.phoneE164);
            console.error('Error details:', e);
            if (e.errors) {
                console.error('Validation errors:', e.errors.map(err => `${err.path}: ${err.message}`).join(', '));
            }
            errors.push({
                phone: customerData.phoneE164,
                name: customerData.name,
                error: e.message,
                details: e.errors ? e.errors.map(err => `${err.path}: ${err.message}`) : undefined
            });
        }
    }

    console.log('═══════════════════════════════════════');
    console.log('BULK INSERT COMPLETE');
    console.log('════════════════════════════════════════');
    console.log('Created:', createdCustomers.length);
    console.log('Skipped:', skipped);
    console.log('Errors:', errors.length);
    console.log('Total processed:', rows.length);
    
    // Log summary
    if (createdCustomers.length === 0 && errors.length === 0 && rows.length > 0) {
        console.warn('⚠️ WARNING: No customers were created and no errors reported. This might indicate an issue.');
        console.warn('Check if all customers already exist (same userId + phoneE164 combination)');
    }

    // Log created customer IDs
    if (createdCustomers.length > 0) {
        console.log('Created customer IDs:', createdCustomers.map(c => c.id));
    }

    try {
        return resolve(res.status(201).json({
            success: true,
            message: "Bulk upload completed",
            created: createdCustomers.length,
            skipped,
            totalProcessed: rows.length,
            errors: errors.length > 0 ? errors : undefined,
            customers: createdCustomers.slice(0, 10) // Return first 10 for response size
        }));
    } catch (err) {
        console.error('Error sending response:', err);
        return resolve(res.status(500).json({
            error: "Failed to send response",
            message: err.message
        }));
    }
}
