// src/controllers/admin.controller.js
import { Plan } from '../models/Plan.js';
import { MenuItem } from '../models/MenuItem.js';
import { PlanMenuItem } from '../models/PlanMenuItem.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Op } from 'sequelize';

/**
 * Render admin page
 */
export const renderAdminPage = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).redirect('/login');
    }

    if (req.user.role !== 'admin') {
      return res.status(403).redirect('/dashboard');
    }

    const user = {
      firstName: req.user.firstName || '',
      lastName: req.user.lastName || '',
      avatar: req.user.avatar || req.user.avatarUrl || null,
      plan: req.user.plan || null,
      role: req.user.role
    };

    // Get API base URL from res.locals (set by app.js middleware)
    const apiBase = res.locals.apiBase || 'http://localhost:3002/api/v1';

    res.render('admin', {
      title: 'Admin - Plans Management',
      user,
      activePage: 'admin',
      apiBase
    });
  } catch (error) {
    console.error('Error rendering admin page:', error);
    res.status(500).send('Failed to load admin page');
  }
};

/**
 * Get all plans (including inactive) - Admin only
 */
export const getAllPlansAdmin = asyncHandler(async (req, res) => {
  try {
    const plans = await Plan.findAll({
      order: [
        ['displayOrder', 'ASC'],
        ['price', 'ASC']
      ]
    });

    // Convert Sequelize instances to plain objects
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
        // Feature flags
        hasEmailTemplates: toBool(planData.hasEmailTemplates),
        hasWhatsAppTemplates: toBool(planData.hasWhatsAppTemplates),
        hasInvoice: toBool(planData.hasInvoice),
        hasAnalytics: toBool(planData.hasAnalytics),
        hasApiAccess: toBool(planData.hasApiAccess),
        hasCustomIntegrations: toBool(planData.hasCustomIntegrations),
        hasPrioritySupport: toBool(planData.hasPrioritySupport),
        isActive: toBool(planData.isActive),
        displayOrder: planData.displayOrder || 0,
        createdAt: planData.createdAt,
        updatedAt: planData.updatedAt
      };
    });

    return res.status(200).json(
      new ApiResponse(200, formattedPlans, 'Plans fetched successfully')
    );
  } catch (error) {
    console.error('Error fetching plans:', error);
    throw new ApiError(500, 'Failed to fetch plans');
  }
});

/**
 * Get single plan by ID - Admin only
 */
export const getPlanById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findByPk(id);

    if (!plan) {
      throw new ApiError(404, 'Plan not found');
    }

    const planData = plan.get ? plan.get({ plain: true }) : plan;
    const toBool = (val) => val === true || val === 1 || val === '1';

    const formattedPlan = {
      id: planData.id,
      name: planData.name,
      slug: planData.slug,
      description: planData.description,
      price: parseFloat(planData.price) || 0,
      yearlyPrice: planData.yearlyPrice ? parseFloat(planData.yearlyPrice) : null,
      currency: planData.currency || 'INR',
      billingPeriod: planData.billingPeriod,
      maxCustomers: planData.maxCustomers,
      maxBusinesses: planData.maxBusinesses,
      maxEmailsPerMonth: planData.maxEmailsPerMonth,
      maxWhatsAppMessagesPerMonth: planData.maxWhatsAppMessagesPerMonth,
      hasEmailTemplates: toBool(planData.hasEmailTemplates),
      hasWhatsAppTemplates: toBool(planData.hasWhatsAppTemplates),
      hasInvoice: toBool(planData.hasInvoice),
      hasAnalytics: toBool(planData.hasAnalytics),
      hasApiAccess: toBool(planData.hasApiAccess),
      hasCustomIntegrations: toBool(planData.hasCustomIntegrations),
      hasPrioritySupport: toBool(planData.hasPrioritySupport),
      isActive: toBool(planData.isActive),
      displayOrder: planData.displayOrder || 0
    };

    return res.status(200).json(
      new ApiResponse(200, formattedPlan, 'Plan fetched successfully')
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Error fetching plan:', error);
    throw new ApiError(500, 'Failed to fetch plan');
  }
});

/**
 * Create new plan - Admin only
 */
export const createPlan = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      yearlyPrice,
      currency,
      billingPeriod,
      maxCustomers,
      maxBusinesses,
      maxEmailsPerMonth,
      maxWhatsAppMessagesPerMonth,
      hasEmailTemplates,
      hasWhatsAppTemplates,
      hasInvoice,
      hasAnalytics,
      hasApiAccess,
      hasCustomIntegrations,
      hasPrioritySupport,
      isActive,
      displayOrder
    } = req.body;

    // Validation
    if (!name || !slug) {
      throw new ApiError(400, 'Name and slug are required');
    }

    // Check if slug already exists
    const existingPlan = await Plan.findOne({ where: { slug } });
    if (existingPlan) {
      throw new ApiError(400, 'Plan with this slug already exists');
    }

    // Create plan
    const plan = await Plan.create({
      name,
      slug,
      description: description || null,
      price: parseFloat(price) || 0,
      yearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : null,
      currency: currency || 'INR',
      billingPeriod: billingPeriod || 'monthly',
      maxCustomers: maxCustomers !== undefined ? (maxCustomers === null || maxCustomers === 'unlimited' ? null : parseInt(maxCustomers)) : 50,
      maxBusinesses: maxBusinesses !== undefined ? (maxBusinesses === null || maxBusinesses === 'unlimited' ? null : parseInt(maxBusinesses)) : 1,
      maxEmailsPerMonth: maxEmailsPerMonth !== undefined ? (maxEmailsPerMonth === null || maxEmailsPerMonth === 'unlimited' ? null : parseInt(maxEmailsPerMonth)) : 100,
      maxWhatsAppMessagesPerMonth: maxWhatsAppMessagesPerMonth !== undefined ? (maxWhatsAppMessagesPerMonth === null || maxWhatsAppMessagesPerMonth === 'unlimited' ? null : parseInt(maxWhatsAppMessagesPerMonth)) : 0,
      hasEmailTemplates: hasEmailTemplates === true || hasEmailTemplates === 'true' || hasEmailTemplates === 1,
      hasWhatsAppTemplates: hasWhatsAppTemplates === true || hasWhatsAppTemplates === 'true' || hasWhatsAppTemplates === 1,
      hasInvoice: hasInvoice === true || hasInvoice === 'true' || hasInvoice === 1,
      hasAnalytics: hasAnalytics === true || hasAnalytics === 'true' || hasAnalytics === 1,
      hasApiAccess: hasApiAccess === true || hasApiAccess === 'true' || hasApiAccess === 1,
      hasCustomIntegrations: hasCustomIntegrations === true || hasCustomIntegrations === 'true' || hasCustomIntegrations === 1,
      hasPrioritySupport: hasPrioritySupport === true || hasPrioritySupport === 'true' || hasPrioritySupport === 1,
      isActive: isActive !== undefined ? (isActive === true || isActive === 'true' || isActive === 1) : true,
      displayOrder: displayOrder ? parseInt(displayOrder) : 0
    });

    const planData = plan.get ? plan.get({ plain: true }) : plan;
    const toBool = (val) => val === true || val === 1 || val === '1';

    return res.status(201).json(
      new ApiResponse(201, {
        id: planData.id,
        name: planData.name,
        slug: planData.slug,
        description: planData.description,
        price: parseFloat(planData.price) || 0,
        yearlyPrice: planData.yearlyPrice ? parseFloat(planData.yearlyPrice) : null,
        currency: planData.currency,
        billingPeriod: planData.billingPeriod,
        maxCustomers: planData.maxCustomers,
        maxBusinesses: planData.maxBusinesses,
        maxEmailsPerMonth: planData.maxEmailsPerMonth,
        maxWhatsAppMessagesPerMonth: planData.maxWhatsAppMessagesPerMonth,
        hasEmailTemplates: toBool(planData.hasEmailTemplates),
        hasWhatsAppTemplates: toBool(planData.hasWhatsAppTemplates),
        hasInvoice: toBool(planData.hasInvoice),
        hasAnalytics: toBool(planData.hasAnalytics),
        hasApiAccess: toBool(planData.hasApiAccess),
        hasCustomIntegrations: toBool(planData.hasCustomIntegrations),
        hasPrioritySupport: toBool(planData.hasPrioritySupport),
        isActive: toBool(planData.isActive),
        displayOrder: planData.displayOrder
      }, 'Plan created successfully')
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Error creating plan:', error);
    throw new ApiError(500, 'Failed to create plan');
  }
});

/**
 * Update plan - Admin only
 */
export const updatePlan = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const plan = await Plan.findByPk(id);

    if (!plan) {
      throw new ApiError(404, 'Plan not found');
    }

    // Check if slug is being changed and if it already exists
    if (updateData.slug && updateData.slug !== plan.slug) {
      const existingPlan = await Plan.findOne({ where: { slug: updateData.slug } });
      if (existingPlan) {
        throw new ApiError(400, 'Plan with this slug already exists');
      }
    }

    // Prepare update data
    const updateFields = {};

    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.slug !== undefined) updateFields.slug = updateData.slug;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.price !== undefined) updateFields.price = parseFloat(updateData.price) || 0;
    if (updateData.yearlyPrice !== undefined) updateFields.yearlyPrice = updateData.yearlyPrice === null || updateData.yearlyPrice === '' ? null : parseFloat(updateData.yearlyPrice);
    if (updateData.currency !== undefined) updateFields.currency = updateData.currency;
    if (updateData.billingPeriod !== undefined) updateFields.billingPeriod = updateData.billingPeriod;
    
    // Feature limits
    if (updateData.maxCustomers !== undefined) {
      updateFields.maxCustomers = updateData.maxCustomers === null || updateData.maxCustomers === 'unlimited' || updateData.maxCustomers === '' ? null : parseInt(updateData.maxCustomers);
    }
    if (updateData.maxBusinesses !== undefined) {
      updateFields.maxBusinesses = updateData.maxBusinesses === null || updateData.maxBusinesses === 'unlimited' || updateData.maxBusinesses === '' ? null : parseInt(updateData.maxBusinesses);
    }
    if (updateData.maxEmailsPerMonth !== undefined) {
      updateFields.maxEmailsPerMonth = updateData.maxEmailsPerMonth === null || updateData.maxEmailsPerMonth === 'unlimited' || updateData.maxEmailsPerMonth === '' ? null : parseInt(updateData.maxEmailsPerMonth);
    }
    if (updateData.maxWhatsAppMessagesPerMonth !== undefined) {
      updateFields.maxWhatsAppMessagesPerMonth = updateData.maxWhatsAppMessagesPerMonth === null || updateData.maxWhatsAppMessagesPerMonth === 'unlimited' || updateData.maxWhatsAppMessagesPerMonth === '' ? null : parseInt(updateData.maxWhatsAppMessagesPerMonth);
    }

    // Feature flags
    if (updateData.hasEmailTemplates !== undefined) {
      updateFields.hasEmailTemplates = updateData.hasEmailTemplates === true || updateData.hasEmailTemplates === 'true' || updateData.hasEmailTemplates === 1;
    }
    if (updateData.hasWhatsAppTemplates !== undefined) {
      updateFields.hasWhatsAppTemplates = updateData.hasWhatsAppTemplates === true || updateData.hasWhatsAppTemplates === 'true' || updateData.hasWhatsAppTemplates === 1;
    }
    if (updateData.hasInvoice !== undefined) {
      updateFields.hasInvoice = updateData.hasInvoice === true || updateData.hasInvoice === 'true' || updateData.hasInvoice === 1;
    }
    if (updateData.hasAnalytics !== undefined) {
      updateFields.hasAnalytics = updateData.hasAnalytics === true || updateData.hasAnalytics === 'true' || updateData.hasAnalytics === 1;
    }
    if (updateData.hasApiAccess !== undefined) {
      updateFields.hasApiAccess = updateData.hasApiAccess === true || updateData.hasApiAccess === 'true' || updateData.hasApiAccess === 1;
    }
    if (updateData.hasCustomIntegrations !== undefined) {
      updateFields.hasCustomIntegrations = updateData.hasCustomIntegrations === true || updateData.hasCustomIntegrations === 'true' || updateData.hasCustomIntegrations === 1;
    }
    if (updateData.hasPrioritySupport !== undefined) {
      updateFields.hasPrioritySupport = updateData.hasPrioritySupport === true || updateData.hasPrioritySupport === 'true' || updateData.hasPrioritySupport === 1;
    }
    if (updateData.isActive !== undefined) {
      updateFields.isActive = updateData.isActive === true || updateData.isActive === 'true' || updateData.isActive === 1;
    }
    if (updateData.displayOrder !== undefined) {
      updateFields.displayOrder = parseInt(updateData.displayOrder) || 0;
    }

    await plan.update(updateFields);

    const planData = plan.get ? plan.get({ plain: true }) : plan;
    const toBool = (val) => val === true || val === 1 || val === '1';

    return res.status(200).json(
      new ApiResponse(200, {
        id: planData.id,
        name: planData.name,
        slug: planData.slug,
        description: planData.description,
        price: parseFloat(planData.price) || 0,
        yearlyPrice: planData.yearlyPrice ? parseFloat(planData.yearlyPrice) : null,
        currency: planData.currency,
        billingPeriod: planData.billingPeriod,
        maxCustomers: planData.maxCustomers,
        maxBusinesses: planData.maxBusinesses,
        maxEmailsPerMonth: planData.maxEmailsPerMonth,
        maxWhatsAppMessagesPerMonth: planData.maxWhatsAppMessagesPerMonth,
        hasEmailTemplates: toBool(planData.hasEmailTemplates),
        hasWhatsAppTemplates: toBool(planData.hasWhatsAppTemplates),
        hasInvoice: toBool(planData.hasInvoice),
        hasAnalytics: toBool(planData.hasAnalytics),
        hasApiAccess: toBool(planData.hasApiAccess),
        hasCustomIntegrations: toBool(planData.hasCustomIntegrations),
        hasPrioritySupport: toBool(planData.hasPrioritySupport),
        isActive: toBool(planData.isActive),
        displayOrder: planData.displayOrder
      }, 'Plan updated successfully')
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Error updating plan:', error);
    throw new ApiError(500, 'Failed to update plan');
  }
});

/**
 * Delete plan - Admin only
 */
export const deletePlan = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findByPk(id);

    if (!plan) {
      throw new ApiError(404, 'Plan not found');
    }

    await plan.destroy();

    return res.status(200).json(
      new ApiResponse(200, null, 'Plan deleted successfully')
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Error deleting plan:', error);
    throw new ApiError(500, 'Failed to delete plan');
  }
});

/**
 * Get all menu items with plan-specific lock status - Admin only
 */
export const getAllMenuItems = asyncHandler(async (req, res) => {
  try {
    const { category } = req.query;
    
    const where = {};
    if (category) {
      where.category = category;
    }

    // Check if table exists, if not return empty array with helpful message
    try {
      const menuItems = await MenuItem.findAll({
        where,
        order: [
          ['category', 'ASC'],
          ['displayOrder', 'ASC']
        ]
      });

      // Get all plans
      const plans = await Plan.findAll({
        where: { isActive: true },
        order: [['displayOrder', 'ASC'], ['price', 'ASC']]
      });

      // Get all plan-menu-item relationships
      let planMenuItems = [];
      try {
        planMenuItems = await PlanMenuItem.findAll();
      } catch (pmError) {
        // If PlanMenuItem table doesn't exist yet, use empty array
        console.log('PlanMenuItem table not found, using empty array:', pmError.message);
      }

      const toBool = (val) => val === true || val === 1 || val === '1';

      // Create a map for quick lookup: planId_menuItemId -> isLocked
      const lockMap = {};
      planMenuItems.forEach(pmi => {
        const key = `${pmi.planId}_${pmi.menuItemId}`;
        lockMap[key] = toBool(pmi.isLocked);
      });

      const formattedItems = menuItems.map(item => {
        const itemData = item.get ? item.get({ plain: true }) : item;
        
        // Build plan-specific lock status
        const planLocks = {};
        plans.forEach(plan => {
          const planData = plan.get ? plan.get({ plain: true }) : plan;
          const key = `${planData.id}_${itemData.id}`;
          planLocks[planData.id] = {
            planId: planData.id,
            planSlug: planData.slug,
            planName: planData.name,
            isLocked: lockMap[key] !== undefined ? lockMap[key] : false
          };
        });

        return {
          id: itemData.id,
          key: itemData.key,
          label: itemData.label,
          icon: itemData.icon,
          route: itemData.route,
          isLocked: toBool(itemData.isLocked), // Global lock (deprecated, kept for backward compatibility)
          requiresPlan: itemData.requiresPlan,
          displayOrder: itemData.displayOrder,
          category: itemData.category,
          description: itemData.description,
          planLocks: planLocks // Plan-specific locks
        };
      });

      return res.status(200).json(
        new ApiResponse(200, {
          menuItems: formattedItems,
          plans: plans.map(p => {
            const pData = p.get ? p.get({ plain: true }) : p;
            return {
              id: pData.id,
              slug: pData.slug,
              name: pData.name
            };
          })
        }, 'Menu items fetched successfully')
      );
    } catch (dbError) {
      // Check if it's a "table doesn't exist" error
      if (dbError.name === 'SequelizeDatabaseError' || 
          dbError.message?.includes("doesn't exist") ||
          dbError.message?.includes("Table") ||
          dbError.message?.includes("Unknown table")) {
        console.error('Menu items table does not exist. Please run migration:', dbError.message);
        return res.status(200).json(
          new ApiResponse(200, { menuItems: [], plans: [] }, 'Menu items table not found. Please run: npm run migrate:menu-items')
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching menu items:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Provide more helpful error message
    const errorMessage = error.message?.includes("doesn't exist") || error.message?.includes("Table")
      ? 'Menu items table not found. Please run: npm run migrate:menu-items'
      : error.message || 'Failed to fetch menu items';
    
    throw new ApiError(500, errorMessage);
  }
});

/**
 * Update plan-specific menu item lock status - Admin only
 */
export const updateMenuItemLock = asyncHandler(async (req, res) => {
  try {
    const { menuItemId, planId } = req.params;
    const { isLocked } = req.body;

    // Validate inputs
    if (!menuItemId || !planId) {
      throw new ApiError(400, 'menuItemId and planId are required');
    }

    // Check if menu item and plan exist
    const menuItem = await MenuItem.findByPk(menuItemId);
    const plan = await Plan.findByPk(planId);

    if (!menuItem) {
      throw new ApiError(404, 'Menu item not found');
    }
    if (!plan) {
      throw new ApiError(404, 'Plan not found');
    }

    // Find or create plan-menu-item relationship
    let planMenuItem;
    try {
      planMenuItem = await PlanMenuItem.findOne({
        where: {
          planId: parseInt(planId),
          menuItemId: parseInt(menuItemId)
        }
      });

      if (!planMenuItem) {
        // Create new relationship
        planMenuItem = await PlanMenuItem.create({
          planId: parseInt(planId),
          menuItemId: parseInt(menuItemId),
          isLocked: isLocked === true || isLocked === 'true' || isLocked === 1
        });
      } else {
        // Update existing relationship
        planMenuItem.isLocked = isLocked === true || isLocked === 'true' || isLocked === 1;
        await planMenuItem.save();
      }
    } catch (dbError) {
      // Check if PlanMenuItem table doesn't exist
      if (dbError.name === 'SequelizeDatabaseError' || 
          dbError.message?.includes("doesn't exist") ||
          dbError.message?.includes("Table") ||
          dbError.message?.includes("Unknown table")) {
        console.error('PlanMenuItem table does not exist. Please run migration:', dbError.message);
        throw new ApiError(500, 'PlanMenuItem table not found. Please run: npm run migrate:plan-menu-items');
      }
      throw dbError;
    }

    const toBool = (val) => val === true || val === 1 || val === '1';
    const itemData = planMenuItem.get ? planMenuItem.get({ plain: true }) : planMenuItem;

    return res.status(200).json(
      new ApiResponse(200, {
        planId: parseInt(planId),
        menuItemId: parseInt(menuItemId),
        isLocked: toBool(itemData.isLocked)
      }, 'Menu item lock status updated successfully')
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Error updating menu item lock:', error);
    throw new ApiError(500, 'Failed to update menu item lock');
  }
});

/**
 * Bulk update menu items lock status - Admin only
 */
export const bulkUpdateMenuItems = asyncHandler(async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, isLocked }

    if (!Array.isArray(items)) {
      throw new ApiError(400, 'Items must be an array');
    }

    const updates = items.map(async ({ id, isLocked }) => {
      const menuItem = await MenuItem.findByPk(id);
      if (menuItem) {
        menuItem.isLocked = isLocked === true || isLocked === 'true' || isLocked === 1;
        await menuItem.save();
      }
    });

    await Promise.all(updates);

    return res.status(200).json(
      new ApiResponse(200, null, 'Menu items updated successfully')
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Error bulk updating menu items:', error);
    throw new ApiError(500, 'Failed to update menu items');
  }
});

