// src/utils/plan.util.js
import { UserPlan } from '../models/UserPlan.js';
import { Plan } from '../models/Plan.js';
import { Op } from 'sequelize';

/**
 * Get the current plan for a user
 * If user doesn't have a plan, automatically assign free trial plan
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} - Plan object with features or null
 */
export async function getUserPlan(userId) {
  try {
    let userPlan = await UserPlan.findOne({
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

    // If user doesn't have a plan, assign free trial plan automatically
    if (!userPlan || !userPlan.plan) {
      console.log(`User ${userId} has no plan, assigning free trial plan...`);
      const assignedPlan = await assignFreeTrialPlan(userId);
      
      if (assignedPlan) {
        // Fetch the newly assigned plan
        userPlan = await UserPlan.findOne({
          where: {
            userId,
            isCurrent: true
          },
          include: [{
            model: Plan,
            as: 'plan',
            required: true
          }]
        });
      }
      
      // If still no plan, return null
      if (!userPlan || !userPlan.plan) {
        console.warn(`Could not assign free trial plan to user ${userId}`);
        return null;
      }
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
 * First tries 'free-trial', then 'free', then any plan with slug containing 'free'
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} - Created UserPlan or null
 */
export async function assignFreeTrialPlan(userId) {
  try {
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

    // Try to find Free Trial plan, then Free plan, then any free plan
    let freePlan = await Plan.findOne({
      where: { slug: 'free-trial' }
    });

    if (!freePlan) {
      freePlan = await Plan.findOne({
        where: { slug: 'free' }
      });
    }

    if (!freePlan) {
      // Try to find any plan with 'free' in the slug
      freePlan = await Plan.findOne({
        where: {
          slug: { [Op.like]: '%free%' }
        },
        order: [['price', 'ASC']] // Get the cheapest free plan
      });
    }

    if (!freePlan) {
      // Last resort: get the cheapest active plan
      freePlan = await Plan.findOne({
        where: { isActive: true },
        order: [['price', 'ASC']]
      });
    }

    if (!freePlan) {
      console.error('No free plan found in database. Please create a free plan first.');
      return null;
    }

    // Create new user plan
    const userPlan = await UserPlan.create({
      userId,
      planId: freePlan.id,
      status: 'trial',
      startDate: new Date(),
      endDate: null, // Free trial has no end date
      isCurrent: true
    });

    console.log(`✅ Assigned ${freePlan.slug} plan to user ${userId}`);
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

