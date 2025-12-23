// src/utils/plan.util.js
import { UserPlan } from '../models/UserPlan.js';
import { Plan } from '../models/Plan.js';

/**
 * Get the current plan for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} - Plan object with features or null
 */
export async function getUserPlan(userId) {
  try {
    const userPlan = await UserPlan.findOne({
      where: {
        userId,
        isCurrent: true
      },
      include: [{
        model: Plan,
        as: 'plan',
        required: false // Use LEFT JOIN in case plan doesn't exist yet
      }]
    });

    if (!userPlan || !userPlan.plan) {
      return null;
    }

    const plan = userPlan.plan.get ? userPlan.plan.get({ plain: true }) : userPlan.plan;

    // Helper to convert MySQL TINYINT to boolean
    const toBool = (val) => val === true || val === 1 || val === '1';

    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      status: userPlan.status,
      startDate: userPlan.startDate,
      endDate: userPlan.endDate,
      // Feature limits
      maxCustomers: plan.maxCustomers,
      maxBusinesses: plan.maxBusinesses,
      maxEmailsPerMonth: plan.maxEmailsPerMonth,
      maxWhatsAppMessagesPerMonth: plan.maxWhatsAppMessagesPerMonth,
      // Feature flags (convert MySQL TINYINT to boolean)
      hasEmailTemplates: toBool(plan.hasEmailTemplates),
      hasWhatsAppTemplates: toBool(plan.hasWhatsAppTemplates),
      hasInvoice: toBool(plan.hasInvoice),
      hasAnalytics: toBool(plan.hasAnalytics),
      hasApiAccess: toBool(plan.hasApiAccess),
      hasCustomIntegrations: toBool(plan.hasCustomIntegrations),
      hasPrioritySupport: toBool(plan.hasPrioritySupport)
    };
  } catch (error) {
    console.error('Error getting user plan:', error);
    return null;
  }
}

/**
 * Assign Free Trial plan to a user
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} - Created UserPlan or null
 */
export async function assignFreeTrialPlan(userId) {
  try {
    // Find Free Trial plan
    const freeTrialPlan = await Plan.findOne({
      where: { slug: 'free-trial' }
    });

    if (!freeTrialPlan) {
      console.error('Free Trial plan not found in database');
      return null;
    }

    // Check if user already has a plan
    const existingPlan = await UserPlan.findOne({
      where: {
        userId,
        isCurrent: true
      }
    });

    if (existingPlan) {
      console.log(`User ${userId} already has a plan assigned`);
      return existingPlan;
    }

    // Create new user plan
    const userPlan = await UserPlan.create({
      userId,
      planId: freeTrialPlan.id,
      status: 'trial',
      startDate: new Date(),
      endDate: null, // Free trial has no end date
      isCurrent: true
    });

    console.log(`✅ Assigned Free Trial plan to user ${userId}`);
    return userPlan;
  } catch (error) {
    console.error('Error assigning Free Trial plan:', error);
    return null;
  }
}

/**
 * Check if user has access to a specific feature
 * @param {number} userId - User ID
 * @param {string} feature - Feature name (e.g., 'hasInvoice', 'hasAnalytics')
 * @returns {Promise<boolean>} - True if user has access
 */
export async function hasFeatureAccess(userId, feature) {
  const plan = await getUserPlan(userId);
  if (!plan) {
    return false; // No plan = no access
  }
  return plan[feature] === true;
}

