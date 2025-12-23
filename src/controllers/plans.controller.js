// src/controllers/plans.controller.js
import { verifyUser } from '../middleware/authMiddleware.js';
import { getUserPlan } from '../utils/plan.util.js';
import { Plan } from '../models/Plan.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const renderPlansPage = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).redirect('/login');
    }

    // Get user's current plan
    const currentPlan = await getUserPlan(req.user.id);
    const currentPlanSlug = currentPlan?.slug || 'free-trial'; // Default to free-trial if no plan

    const user = {
      firstName: req.user.firstName || '',
      lastName: req.user.lastName || '',
      plan: req.user.plan || null,
    };

    res.render('plans', {
      title: 'Plans',
      user,
      activePage: 'plans',
      currentPlanSlug // Pass current plan slug to template
    });
  } catch (error) {
    console.error('Error rendering plans page:', error);
    res.status(500).send('Failed to load plans page');
  }
};

// API endpoint to fetch all active plans
export const getAllPlans = asyncHandler(async (req, res) => {
  try {
    const plans = await Plan.findAll({
      where: {
        isActive: true
      },
      order: [
        ['displayOrder', 'ASC'],
        ['price', 'ASC']
      ],
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      }
    });

    // Convert Sequelize instances to plain objects and format for frontend
    const formattedPlans = plans.map(plan => {
      const planData = plan.get ? plan.get({ plain: true }) : plan;
      
      // Helper to convert MySQL TINYINT to boolean
      const toBool = (val) => val === true || val === 1 || val === '1';
      
      return {
        id: planData.id,
        name: planData.name,
        slug: planData.slug,
        description: planData.description,
        price: parseFloat(planData.price) || 0,
        yearlyPrice: planData.yearlyPrice ? parseFloat(planData.yearlyPrice) : null,
        currency: planData.currency || 'INR',
        billingPeriod: planData.billingPeriod,
        // Feature limits
        maxCustomers: planData.maxCustomers,
        maxBusinesses: planData.maxBusinesses,
        maxEmailsPerMonth: planData.maxEmailsPerMonth,
        maxWhatsAppMessagesPerMonth: planData.maxWhatsAppMessagesPerMonth,
        // Feature flags (convert MySQL TINYINT to boolean)
        hasEmailTemplates: toBool(planData.hasEmailTemplates),
        hasWhatsAppTemplates: toBool(planData.hasWhatsAppTemplates),
        hasInvoice: toBool(planData.hasInvoice),
        hasAnalytics: toBool(planData.hasAnalytics),
        hasApiAccess: toBool(planData.hasApiAccess),
        hasCustomIntegrations: toBool(planData.hasCustomIntegrations),
        hasPrioritySupport: toBool(planData.hasPrioritySupport),
        displayOrder: planData.displayOrder || 0
      };
    });

    return res.status(200).json(
      new ApiResponse(200, formattedPlans, 'Plans fetched successfully')
    );
  } catch (error) {
    console.error('Error fetching plans:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch plans',
      error: error.message
    });
  }
});

