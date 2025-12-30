// src/controllers/leadForm.controller.js
import { LeadForm } from '../models/LeadForm.js';
import { Customer } from '../models/Customer.js';
import { Business } from '../models/Business.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Op } from 'sequelize';
import { autoLogEvent } from './note.controller.js';
import crypto from 'crypto';

// Helper function to convert 10-digit phone to E164
function toE164(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91${cleaned}`; // Default to India (+91)
  }
  if (cleaned.length > 10 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  return null;
}

// Helper function to validate 10-digit phone
function is10DigitPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 12 || cleaned.length === 13;
}

// Render lead forms management page
export const renderLeadFormsPage = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).redirect('/login');
    }

    const user = {
      firstName: req.user.firstName || '',
      lastName: req.user.lastName || '',
      avatar: req.user.avatar || req.user.avatarUrl || null,
      plan: req.user.plan || null,
    };

    res.render('leadForms', {
      title: 'Lead Capture Forms',
      user,
      activePage: 'leadForms'
    });
  } catch (error) {
    console.error('Error rendering lead forms page:', error);
    res.status(500).send('Failed to load lead forms page');
  }
};

// Render public form page (for hosted link)
export const renderPublicForm = async (req, res) => {
  try {
    const { slug } = req.params;

    const form = await LeadForm.findOne({
      where: {
        slug,
        isActive: true
      },
      include: [
        { model: Business, as: 'business', required: false }
      ]
    });

    if (!form) {
      return res.status(404).send('Form not found or inactive');
    }

    // Prepare fields with helper properties for Handlebars
    const fields = (form.fields || []).map(field => ({
      ...field,
      isMessage: field.type === 'message',
      inputType: field.type === 'email' ? 'email' : (field.type === 'phone' ? 'tel' : 'text')
    }));

    res.render('publicLeadForm', {
      title: form.name,
      form: {
        id: form.id,
        name: form.name,
        description: form.description,
        fields: fields,
        successMessage: form.successMessage,
        redirectUrl: form.redirectUrl,
        slug: form.slug
      }
    });
  } catch (error) {
    console.error('Error rendering public form:', error);
    res.status(500).send('Failed to load form');
  }
};

// Get all lead forms for user
export const getLeadForms = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    const forms = await LeadForm.findAll({
      where: { userId },
      include: [
        { model: Business, as: 'business', required: false }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json(
      new ApiResponse(200, forms, 'Lead forms fetched successfully')
    );
  } catch (error) {
    console.error('Error fetching lead forms:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch lead forms',
      error: error.message
    });
  }
});

// Get single lead form
export const getLeadForm = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const form = await LeadForm.findOne({
      where: {
        id,
        userId
      },
      include: [
        { model: Business, as: 'business', required: false }
      ]
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Lead form not found'
      });
    }

    return res.status(200).json(
      new ApiResponse(200, form, 'Lead form fetched successfully')
    );
  } catch (error) {
    console.error('Error fetching lead form:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch lead form',
      error: error.message
    });
  }
});

// Create new lead form
export const createLeadForm = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      name, 
      businessId, 
      description, 
      fields, 
      successMessage, 
      redirectUrl,
      status,
      theme,
      leadSettings,
      successBehavior,
      notifications,
      antiSpam,
      consentRequired,
      consentText
    } = req.body;

    if (!name || !fields || !Array.isArray(fields)) {
      return res.status(400).json({
        success: false,
        message: 'Name and fields are required'
      });
    }

    // Generate unique slug
    const baseSlug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    while (await LeadForm.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const form = await LeadForm.create({
      userId,
      businessId: businessId || null,
      name,
      slug,
      description: description || null,
      fields: fields || [],
      successMessage: successMessage || 'Thank you! We will contact you soon.',
      redirectUrl: redirectUrl || null,
      status: status || 'draft',
      isActive: status === 'published',
      theme: theme || null,
      leadSettings: leadSettings || null,
      successBehavior: successBehavior || null,
      notifications: notifications || null,
      antiSpam: antiSpam || null,
      consentRequired: consentRequired || false,
      consentText: consentText || null,
      analytics: {
        views: 0,
        submissions: 0,
        conversionRate: 0
      }
    });

    return res.status(201).json(
      new ApiResponse(201, form, 'Lead form created successfully')
    );
  } catch (error) {
    console.error('Error creating lead form:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create lead form',
      error: error.message
    });
  }
});

// Update lead form
export const updateLeadForm = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { 
      name, 
      businessId, 
      description, 
      fields, 
      successMessage, 
      redirectUrl, 
      isActive,
      status,
      theme,
      leadSettings,
      successBehavior,
      notifications,
      antiSpam,
      consentRequired,
      consentText
    } = req.body;

    const form = await LeadForm.findOne({
      where: {
        id,
        userId
      }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Lead form not found'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (businessId !== undefined) updateData.businessId = businessId || null;
    if (description !== undefined) updateData.description = description || null;
    if (fields !== undefined) updateData.fields = fields;
    if (successMessage !== undefined) updateData.successMessage = successMessage;
    if (redirectUrl !== undefined) updateData.redirectUrl = redirectUrl || null;
    if (status !== undefined) {
      updateData.status = status;
      updateData.isActive = status === 'published';
    } else if (isActive !== undefined) {
      updateData.isActive = isActive;
      updateData.status = isActive ? 'published' : 'draft';
    }
    if (theme !== undefined) updateData.theme = theme;
    if (leadSettings !== undefined) updateData.leadSettings = leadSettings;
    if (successBehavior !== undefined) updateData.successBehavior = successBehavior;
    if (notifications !== undefined) updateData.notifications = notifications;
    if (antiSpam !== undefined) updateData.antiSpam = antiSpam;
    if (consentRequired !== undefined) updateData.consentRequired = consentRequired;
    if (consentText !== undefined) updateData.consentText = consentText;

    // If name changed, regenerate slug
    if (name && name !== form.name) {
      const baseSlug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      let slug = baseSlug;
      let counter = 1;
      while (await LeadForm.findOne({ where: { slug, id: { [Op.ne]: id } } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updateData.slug = slug;
    }

    await form.update(updateData);

    return res.status(200).json(
      new ApiResponse(200, form, 'Lead form updated successfully')
    );
  } catch (error) {
    console.error('Error updating lead form:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update lead form',
      error: error.message
    });
  }
});

// Delete lead form
export const deleteLeadForm = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const form = await LeadForm.findOne({
      where: {
        id,
        userId
      }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Lead form not found'
      });
    }

    await form.destroy();

    return res.status(200).json(
      new ApiResponse(200, null, 'Lead form deleted successfully')
    );
  } catch (error) {
    console.error('Error deleting lead form:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete lead form',
      error: error.message
    });
  }
});

// Submit lead form (public endpoint - no auth required)
export const submitLeadForm = asyncHandler(async (req, res) => {
  try {
    const { slug } = req.params;
    const formData = req.body;
    
    // Get IP address and user agent
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || '';
    
    // Extract UTM parameters from query string or form data
    const utmSource = req.query.utm_source || formData.utm_source || null;
    const utmCampaign = req.query.utm_campaign || formData.utm_campaign || null;
    const utmMedium = req.query.utm_medium || formData.utm_medium || null;

    // Find the form
    const form = await LeadForm.findOne({
      where: {
        slug,
        status: 'published'
      },
      include: [
        { model: Business, as: 'business', required: false },
        { model: User, as: 'user', required: false }
      ]
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or not published'
      });
    }

    // Anti-spam checks
    if (form.antiSpam) {
      // Check honeypot field
      if (form.antiSpam.honeypot && formData['website_url']) {
        return res.status(200).json({
          success: true,
          message: form.successMessage // Don't reveal it's spam
        });
      }
      
      // Rate limiting by IP
      if (form.antiSpam.rateLimit) {
        const recentSubmissions = await FormSubmission.count({
          where: {
            formId: form.id,
            ipAddress,
            createdAt: {
              [Op.gte]: new Date(Date.now() - 60 * 60 * 1000) // Last hour
            }
          }
        });
        
        if (recentSubmissions >= 3) {
          return res.status(429).json({
            success: false,
            message: 'Too many submissions. Please try again later.'
          });
        }
      }
    }

    const userId = form.userId;
    const businessId = form.businessId;
    const leadSettings = form.leadSettings || {};

    // Extract data from form fields
    let customerName = '';
    let email = '';
    let phone = '';
    let message = '';
    const submittedData = {};

    form.fields.forEach(field => {
      const value = formData[field.name] || formData[field.key] || '';
      submittedData[field.name || field.key] = value;
      
      if (field.type === 'name' || field.name.toLowerCase().includes('name')) {
        customerName = value;
      } else if (field.type === 'email' || field.name.toLowerCase().includes('email')) {
        email = value;
      } else if (field.type === 'phone' || field.name.toLowerCase().includes('phone')) {
        phone = value;
      } else if (field.type === 'textarea' || field.type === 'message' || field.name.toLowerCase().includes('message')) {
        message = value;
      }
    });

    // Validate required fields
    const requiredFields = form.fields.filter(f => f.required);
    for (const field of requiredFields) {
      const value = formData[field.name] || formData[field.key] || '';
      if (!value) {
        return res.status(400).json({
          success: false,
          message: `${field.label} is required`
        });
      }
      
      // Field-specific validation
      if (field.validation === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid email format for ${field.label}`
        });
      }
      
      if (field.validation === 'phone' && !is10DigitPhone(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid phone format for ${field.label}`
        });
      }
    }

    // Phone is required for CRM
    if (!phone || !is10DigitPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Valid phone number is required'
      });
    }

    const phoneE164 = toE164(phone);
    if (!phoneE164) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Check for duplicate based on duplicate handling setting
    const duplicateHandling = leadSettings.duplicateHandling || 'update';
    const existingCustomer = await Customer.findOne({
      where: {
        userId,
        phoneE164
      }
    });

    let customer = null;
    let isDuplicate = false;
    let submissionStatus = 'new';

    if (existingCustomer) {
      isDuplicate = true;
      
      if (duplicateHandling === 'block') {
        return res.status(400).json({
          success: false,
          message: 'A lead with this phone number already exists'
        });
      } else if (duplicateHandling === 'update') {
        customer = existingCustomer;
        const updateData = {};
        if (customerName && !customer.name) updateData.name = customerName;
        if (email && !customer.email) updateData.email = email;
        
        // Update tags
        const tags = customer.tags || [];
        const formTags = leadSettings.tags || ['Lead Form'];
        formTags.forEach(tag => {
          if (!tags.includes(tag)) tags.push(tag);
        });
        updateData.tags = tags;
        
        await customer.update(updateData);
        
        // Append note about duplicate submission
        await autoLogEvent(
          userId,
          customer.id,
          'customer_updated',
          `Lead form resubmission from: ${form.name}${message ? ` - Message: ${message.substring(0, 100)}` : ''}`,
          form.id
        );
        
        submissionStatus = 'duplicate';
      } else {
        // Create new anyway
        customer = await Customer.create({
          userId,
          businessId: businessId || null,
          name: customerName || null,
          email: email || null,
          phoneE164,
          tags: leadSettings.tags || ['Lead Form']
        });
        
        await autoLogEvent(
          userId,
          customer.id,
          'customer_created',
          `Lead captured from form: ${form.name}${message ? ` - Message: ${message.substring(0, 100)}` : ''}`,
          form.id
        );
      }
    } else {
      // Create new customer
      customer = await Customer.create({
        userId,
        businessId: businessId || null,
        name: customerName || null,
        email: email || null,
        phoneE164,
        tags: leadSettings.tags || ['Lead Form']
      });
      
      await autoLogEvent(
        userId,
        customer.id,
        'customer_created',
        `Lead captured from form: ${form.name}${message ? ` - Message: ${message.substring(0, 100)}` : ''}`,
        form.id
      );
    }

    // Create form submission record for analytics
    const submission = await FormSubmission.create({
      formId: form.id,
      customerId: customer.id,
      submittedData,
      ipAddress,
      userAgent,
      referrer,
      utmSource,
      utmCampaign,
      utmMedium,
      status: submissionStatus
    });

    // Update form analytics
    const analytics = form.analytics || { views: 0, submissions: 0 };
    analytics.submissions = (analytics.submissions || 0) + 1;
    analytics.conversionRate = analytics.views > 0 
      ? ((analytics.submissions / analytics.views) * 100).toFixed(2)
      : 0;
    await form.update({ analytics });

    // Handle notifications
    if (form.notifications) {
      const { sendDocumentEmail } = await import('../utils/emailService.js');
      
      // Notify form owner
      if (form.notifications.onSubmission && form.user?.email) {
        try {
          await sendDocumentEmail({
            to: form.user.email,
            subject: `New Lead Submission: ${form.name}`,
            html: `
              <h2>New Lead Submission</h2>
              <p><strong>Form:</strong> ${form.name}</p>
              <p><strong>Customer:</strong> ${customerName || 'N/A'}</p>
              <p><strong>Email:</strong> ${email || 'N/A'}</p>
              <p><strong>Phone:</strong> ${phone}</p>
              ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
              <p><a href="${process.env.PRODUCTION_URL || 'http://localhost:3002'}/customers">View in CRM</a></p>
            `
          });
        } catch (error) {
          console.error('Error sending notification email:', error);
        }
      }
      
      // Auto-reply to lead
      if (form.notifications.autoReplyEmail && email) {
        try {
          const successBehavior = form.successBehavior || {};
          const replySubject = successBehavior.replySubject || 'Thank you for contacting us!';
          const replyMessage = successBehavior.replyMessage || form.successMessage;
          
          await sendDocumentEmail({
            to: email,
            subject: replySubject,
            html: `
              <h2>Thank you for your interest!</h2>
              <p>${replyMessage}</p>
              <p>We will contact you soon.</p>
            `
          });
        } catch (error) {
          console.error('Error sending auto-reply email:', error);
        }
      }
    }

    // Handle success behavior
    const successBehavior = form.successBehavior || { type: 'message' };
    let responseData = {
      success: true,
      message: form.successMessage
    };

    if (successBehavior.type === 'redirect' && successBehavior.redirectUrl) {
      responseData.redirectUrl = successBehavior.redirectUrl;
    } else if (successBehavior.type === 'download' && successBehavior.downloadUrl) {
      responseData.downloadUrl = successBehavior.downloadUrl;
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error submitting lead form:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit form. Please try again.',
      error: error.message
    });
  }
});

// Get embed code for form
export const getEmbedCode = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { type = 'iframe' } = req.query; // 'iframe' or 'script'

    const form = await LeadForm.findOne({
      where: {
        id,
        userId
      }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Lead form not found'
      });
    }

    const nodeEnv = process.env.NODE_ENV || 'development';
    const productionUrl = process.env.PRODUCTION_URL || 'https://petserviceinhome.com';
    const developmentUrl = process.env.DEVELOPMENT_URL || `http://localhost:${process.env.PORT || 3002}`;
    const baseUrl = (nodeEnv === 'prod' || nodeEnv === 'production') ? productionUrl : developmentUrl;
    const formUrl = `${baseUrl}/forms/${form.slug}`;

    let embedCode = '';
    if (type === 'iframe') {
      embedCode = `<iframe src="${formUrl}" width="100%" height="600" frameborder="0" style="border: none; border-radius: 8px;"></iframe>`;
    } else {
      embedCode = `<script src="${baseUrl}/public/js/lead-form-embed.js" data-form-slug="${form.slug}"></script>`;
    }

    return res.status(200).json({
      success: true,
      embedCode,
      hostedUrl: formUrl
    });
  } catch (error) {
    console.error('Error generating embed code:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate embed code',
      error: error.message
    });
  }
});

