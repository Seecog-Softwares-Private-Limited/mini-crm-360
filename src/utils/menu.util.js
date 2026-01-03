// src/utils/menu.util.js
import { MenuItem } from '../models/MenuItem.js';
import { PlanMenuItem } from '../models/PlanMenuItem.js';
import { getUserPlan } from './plan.util.js';

/**
 * Get available menu items for a user based on their plan and plan-specific lock status
 * @param {number} userId - User ID
 * @param {string} category - Menu category (e.g., 'crm_tools')
 * @returns {Promise<Array>} Array of menu items available to the user
 */
export async function getAvailableMenuItems(userId, category = 'crm_tools') {
  try {
    // Get user's plan
    const userPlan = await getUserPlan(userId);
    const userPlanId = userPlan?.id || null;
    const userPlanSlug = userPlan?.slug || null;

    // Get all menu items for the category (ignore global isLocked, use plan-specific)
    const menuItems = await MenuItem.findAll({
      where: {
        category
      },
      order: [['displayOrder', 'ASC']]
    });

    // If user has no plan, show all items but mark those requiring a plan as locked
    if (!userPlanId) {
      return menuItems.map(item => {
        const itemData = item.get ? item.get({ plain: true }) : item;
        const requiresPlan = itemData.requiresPlan !== null && itemData.requiresPlan !== undefined;
        
        return {
          key: itemData.key,
          label: itemData.label,
          icon: itemData.icon,
          route: itemData.route,
          displayOrder: itemData.displayOrder,
          category: itemData.category,
          isLocked: requiresPlan, // Lock items that require a plan
          requiresPlan: itemData.requiresPlan,
          requiresUpgrade: requiresPlan
        };
      });
    }

    // Get plan-specific lock status for user's plan
    const planMenuItems = await PlanMenuItem.findAll({
      where: {
        planId: userPlanId
      }
    });

    // Create a map: menuItemId -> isLocked
    const lockMap = {};
    planMenuItems.forEach(pmi => {
      const pmiData = pmi.get ? pmi.get({ plain: true }) : pmi;
      const toBool = (val) => val === true || val === 1 || val === '1';
      lockMap[pmiData.menuItemId] = toBool(pmiData.isLocked);
    });

    // Check if plan is "free"
    const isFreePlan = userPlanSlug === 'free';

    // Basic menu items that should be available even for free plan
    const freePlanAllowedItems = ['dashboard', 'business', 'customers'];

    // Map menu items to plan features
    const menuItemFeatureMap = {
      'invoice': 'hasInvoice',
      'campaigns': 'hasEmailTemplates', // Campaigns typically require email templates
      'analytics': 'hasAnalytics',
      // Add more mappings as needed
    };

    // Return all items, but mark locked ones
    // Don't filter out locked items - show them as disabled
    const allItems = menuItems.map(item => {
      const itemData = item.get ? item.get({ plain: true }) : item;
      
      // Check plan-specific lock status
      const isLockedByAdmin = lockMap[itemData.id] !== undefined ? lockMap[itemData.id] : false;
      
      // Check if item requires a plan and user doesn't have access
      let requiresUpgrade = false;
      if (itemData.requiresPlan) {
        if (!userPlanSlug) {
          requiresUpgrade = true;
        } else {
          // Simple plan hierarchy check
          const planHierarchy = ['free-trial', 'free', 'silver', 'gold', 'enterprise'];
          const requiredIndex = planHierarchy.indexOf(itemData.requiresPlan);
          const userPlanIndex = planHierarchy.indexOf(userPlanSlug);
          
          if (userPlanIndex < requiredIndex) {
            requiresUpgrade = true;
          }
        }
      }

      // Check if menu item requires a plan feature that the user doesn't have
      let featureNotAvailable = false;
      const requiredFeature = menuItemFeatureMap[itemData.key];
      if (requiredFeature && userPlan) {
        const toBool = (val) => val === true || val === 1 || val === '1';
        const planData = userPlan;
        if (planData[requiredFeature] === false || planData[requiredFeature] === 0 || !toBool(planData[requiredFeature])) {
          featureNotAvailable = true;
        }
      }

      // Special handling for invoice - check hasInvoice feature
      // Note: Invoice is now enabled for all plans, but we keep this check for backward compatibility
      if (itemData.key === 'invoice' && userPlan) {
        const toBool = (val) => val === true || val === 1 || val === '1';
        // If hasInvoice is explicitly false, lock it; otherwise allow it
        if (userPlan.hasInvoice === false || userPlan.hasInvoice === 0) {
          featureNotAvailable = true;
        } else {
          // Invoice is enabled - don't lock it
          featureNotAvailable = false;
        }
      }
      
      // For free plan: lock all items EXCEPT basic ones (dashboard, business, customers)
      // Unless explicitly locked by admin
      let itemIsLocked = false;
      if (isFreePlan) {
        // If it's a basic item and not locked by admin, allow it
        if (freePlanAllowedItems.includes(itemData.key) && !isLockedByAdmin) {
          itemIsLocked = false;
        } else {
          // Lock all other items for free plan
          itemIsLocked = true;
        }
      } else {
        // For non-free plans, check other lock conditions
        itemIsLocked = isLockedByAdmin || requiresUpgrade || featureNotAvailable;
      }
      
      return {
        key: itemData.key,
        label: itemData.label,
        icon: itemData.icon,
        route: itemData.route,
        displayOrder: itemData.displayOrder,
        category: itemData.category,
        isLocked: itemIsLocked,
        requiresPlan: itemData.requiresPlan,
        requiresUpgrade: requiresUpgrade || featureNotAvailable,
        isFreePlan: isFreePlan // Pass this flag for UI display
      };
    });

    return allItems;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    // Return empty array on error to prevent breaking the UI
    return [];
  }
}

/**
 * Get all menu items (including locked) - Admin only
 * @param {string} category - Menu category
 * @returns {Promise<Array>} Array of all menu items
 */
export async function getAllMenuItems(category = null) {
  try {
    const where = {};
    if (category) {
      where.category = category;
    }

    const menuItems = await MenuItem.findAll({
      where,
      order: [
        ['category', 'ASC'],
        ['displayOrder', 'ASC']
      ]
    });

    return menuItems.map(item => {
      const itemData = item.get ? item.get({ plain: true }) : item;
      const toBool = (val) => val === true || val === 1 || val === '1';
      
      return {
        id: itemData.id,
        key: itemData.key,
        label: itemData.label,
        icon: itemData.icon,
        route: itemData.route,
        isLocked: toBool(itemData.isLocked),
        requiresPlan: itemData.requiresPlan,
        displayOrder: itemData.displayOrder,
        category: itemData.category,
        description: itemData.description
      };
    });
  } catch (error) {
    console.error('Error fetching all menu items:', error);
    return [];
  }
}

