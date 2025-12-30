// src/controllers/reminder.controller.js
import { Customer } from '../models/Customer.js';
import { Template } from '../models/Template.js';
import EmailTemplate from '../models/EmailTemplate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Op } from 'sequelize';
import { sendTemplateMessage } from './service/whatsapp.service.js';
import { sendDocumentEmail } from '../utils/emailService.js';
import { autoLogEvent } from './note.controller.js';

// Render reminders page
export const renderRemindersPage = async (req, res) => {
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

    res.render('reminders', {
      title: 'Birthday & Anniversary Reminders',
      user,
      activePage: 'reminders'
    });
  } catch (error) {
    console.error('Error rendering reminders page:', error);
    res.status(500).send('Failed to load reminders page');
  }
};

// Get upcoming birthdays and anniversaries
export const getUpcomingReminders = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query; // Default to next 30 days

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + parseInt(days));

    // Get customers with birthdays in the next N days
    const customers = await Customer.findAll({
      where: {
        userId,
        [Op.or]: [
          { dateOfBirth: { [Op.ne]: null } },
          { anniversaryDate: { [Op.ne]: null } }
        ]
      },
      attributes: ['id', 'name', 'firstName', 'lastName', 'email', 'phoneE164', 'dateOfBirth', 'anniversaryDate']
    });

    const reminders = [];

    customers.forEach(customer => {
      const customerName = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unnamed Customer';

      // Process birthday
      if (customer.dateOfBirth) {
        const dob = new Date(customer.dateOfBirth);
        const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        const nextYearBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
        
        let upcomingBirthday = thisYearBirthday < today ? nextYearBirthday : thisYearBirthday;
        
        if (upcomingBirthday >= today && upcomingBirthday <= endDate) {
          const daysUntil = Math.ceil((upcomingBirthday - today) / (1000 * 60 * 60 * 24));
          reminders.push({
            id: `birthday_${customer.id}`,
            customerId: customer.id,
            customerName,
            email: customer.email,
            phoneE164: customer.phoneE164,
            type: 'birthday',
            date: upcomingBirthday,
            daysUntil,
            isToday: daysUntil === 0,
            originalDate: customer.dateOfBirth
          });
        }
      }

      // Process anniversary
      if (customer.anniversaryDate) {
        const anniv = new Date(customer.anniversaryDate);
        const thisYearAnniversary = new Date(today.getFullYear(), anniv.getMonth(), anniv.getDate());
        const nextYearAnniversary = new Date(today.getFullYear() + 1, anniv.getMonth(), anniv.getDate());
        
        let upcomingAnniversary = thisYearAnniversary < today ? nextYearAnniversary : thisYearAnniversary;
        
        if (upcomingAnniversary >= today && upcomingAnniversary <= endDate) {
          const daysUntil = Math.ceil((upcomingAnniversary - today) / (1000 * 60 * 60 * 24));
          reminders.push({
            id: `anniversary_${customer.id}`,
            customerId: customer.id,
            customerName,
            email: customer.email,
            phoneE164: customer.phoneE164,
            type: 'anniversary',
            date: upcomingAnniversary,
            daysUntil,
            isToday: daysUntil === 0,
            originalDate: customer.anniversaryDate
          });
        }
      }
    });

    // Sort by date (today first, then by days until)
    reminders.sort((a, b) => {
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;
      return a.daysUntil - b.daysUntil;
    });

    return res.status(200).json(
      new ApiResponse(200, reminders, 'Reminders fetched successfully')
    );
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reminders',
      error: error.message
    });
  }
});

// Update customer DOB/Anniversary
export const updateCustomerReminders = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { customerId } = req.params;
    const { dateOfBirth, anniversaryDate } = req.body;

    const customer = await Customer.findOne({
      where: {
        id: customerId,
        userId
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const updateData = {};
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth || null;
    }
    if (anniversaryDate !== undefined) {
      updateData.anniversaryDate = anniversaryDate || null;
    }

    await customer.update(updateData);

    return res.status(200).json(
      new ApiResponse(200, customer, 'Customer reminders updated successfully')
    );
  } catch (error) {
    console.error('Error updating customer reminders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update reminders',
      error: error.message
    });
  }
});

// Send birthday/anniversary wish
export const sendWish = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { customerId, type, channel, templateId, emailTemplateId, customMessage } = req.body;

    if (!customerId || !type || !channel) {
      return res.status(400).json({
        success: false,
        message: 'customerId, type, and channel are required'
      });
    }

    const customer = await Customer.findOne({
      where: {
        id: customerId,
        userId
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const customerName = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Valued Customer';
    let messageSent = false;
    let errorMessage = null;

    if (channel === 'whatsapp') {
      if (!customer.phoneE164) {
        return res.status(400).json({
          success: false,
          message: 'Customer does not have a WhatsApp number'
        });
      }

      let messageContent = customMessage || `Happy ${type === 'birthday' ? 'Birthday' : 'Anniversary'} ${customerName}! 🎉`;

      // If template is provided, use it
      if (templateId) {
        const template = await Template.findOne({
          where: {
            id: templateId,
            userId
          }
        });

        if (template) {
          try {
            const response = await sendTemplateMessage({
              to: customer.phoneE164,
              templateName: template.waName,
              language: template.language || 'en_US',
              components: template.components || []
            });

            if (response?.messages?.[0]?.id) {
              messageSent = true;
              
              // Auto-log wish sent event
              await autoLogEvent(
                userId,
                customerId,
                'whatsapp_sent',
                `${type === 'birthday' ? 'Birthday' : 'Anniversary'} wish sent via WhatsApp`,
                response.messages[0].id
              );
            }
          } catch (error) {
            console.error('Error sending WhatsApp wish:', error);
            errorMessage = error.message;
          }
        }
      } else {
        // Send simple text message (if your WhatsApp service supports it)
        // For now, we'll use a template approach
        return res.status(400).json({
          success: false,
          message: 'WhatsApp template is required. Please select a template.'
        });
      }
    } else if (channel === 'email') {
      if (!customer.email) {
        return res.status(400).json({
          success: false,
          message: 'Customer does not have an email address'
        });
      }

      let subject = '';
      let htmlContent = '';

      if (emailTemplateId) {
        const emailTemplate = await EmailTemplate.findOne({
          where: {
            id: emailTemplateId,
            deleted: false
          }
        });

        if (emailTemplate) {
          subject = emailTemplate.subject || `Happy ${type === 'birthday' ? 'Birthday' : 'Anniversary'}!`;
          htmlContent = emailTemplate.bodyHtml || customMessage || `Happy ${type === 'birthday' ? 'Birthday' : 'Anniversary'} ${customerName}! 🎉`;

          // Replace placeholders
          const placeholders = {
            '{{customerName}}': customerName,
            '{{name}}': customerName,
            '{{employeeName}}': customerName,
            '{{type}}': type === 'birthday' ? 'Birthday' : 'Anniversary'
          };

          Object.keys(placeholders).forEach(key => {
            const value = placeholders[key];
            subject = subject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
            htmlContent = htmlContent.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
          });
        }
      } else {
        subject = `Happy ${type === 'birthday' ? 'Birthday' : 'Anniversary'}!`;
        htmlContent = customMessage || `
          <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2 style="color: #667eea;">Happy ${type === 'birthday' ? 'Birthday' : 'Anniversary'} ${customerName}! 🎉</h2>
            <p>Wishing you a wonderful day filled with joy and happiness!</p>
          </div>
        `;
      }

      try {
        const emailSent = await sendDocumentEmail({
          to: customer.email,
          subject: subject,
          html: htmlContent
        });

        if (emailSent) {
          messageSent = true;
          
          // Auto-log wish sent event
          await autoLogEvent(
            userId,
            customerId,
            'email_sent',
            `${type === 'birthday' ? 'Birthday' : 'Anniversary'} wish sent via email (Subject: ${subject})`,
            emailTemplateId
          );
        } else {
          errorMessage = 'Email service returned false';
        }
      } catch (error) {
        console.error('Error sending email wish:', error);
        errorMessage = error.message;
      }
    }

    if (messageSent) {
      return res.status(200).json({
        success: true,
        message: `${type === 'birthday' ? 'Birthday' : 'Anniversary'} wish sent successfully`,
        channel
      });
    } else {
      return res.status(500).json({
        success: false,
        message: errorMessage || 'Failed to send wish'
      });
    }
  } catch (error) {
    console.error('Error sending wish:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send wish',
      error: error.message
    });
  }
});

