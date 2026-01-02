// src/services/socialPublisher.service.js
import { SocialAccount } from '../models/SocialAccount.js';
import { SocialPost } from '../models/SocialPost.js';
import { SocialPostChannel } from '../models/SocialPostChannel.js';
import { SocialTemplate } from '../models/SocialTemplate.js';
import { MediaAsset } from '../models/MediaAsset.js';
import { PublishAttempt } from '../models/PublishAttempt.js';
import { SocialAuditLog } from '../models/SocialAuditLog.js';
import { ApiError } from '../utils/ApiError.js';
import { sequelize } from '../db/index.js';
import { Op } from 'sequelize';

// Platform character limits
const PLATFORM_LIMITS = {
  facebook: { text: 63206, link: true },
  linkedin: { text: 3000, link: true },
  twitter: { text: 280, link: true },
  instagram: { text: 2200, link: false },
  whatsapp: { text: 4096, link: true }
};

/**
 * Get character limit for a platform
 */
export function getPlatformLimit(platform) {
  return PLATFORM_LIMITS[platform] || { text: 1000, link: true };
}

/**
 * Validate post content length for platforms
 */
export function validateContentLength(content, platforms) {
  const errors = {};
  const contentLength = content.length;

  platforms.forEach(platform => {
    const limit = getPlatformLimit(platform);
    if (contentLength > limit.text) {
      errors[platform] = `Content exceeds ${limit.text} character limit for ${platform}`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Create social account
 */
export async function createSocialAccount(userId, businessId, accountData) {
  const account = await SocialAccount.create({
    userId,
    businessId,
    ...accountData
  });

  await logAudit(userId, 'account_connected', 'account', account.id, {
    platform: accountData.platform,
    accountName: accountData.accountName
  });

  return account;
}

/**
 * Get user's social accounts
 */
export async function getUserSocialAccounts(userId, businessId = null) {
  try {
    const where = { userId, isActive: true };
    if (businessId) {
      where.businessId = businessId;
    }

    return await SocialAccount.findAll({
      where,
      order: [['platform', 'ASC'], ['accountName', 'ASC']]
    });
  } catch (error) {
    // If table doesn't exist yet, return empty array
    if (error.name === 'SequelizeDatabaseError' && error.message.includes("doesn't exist")) {
      console.warn('Social accounts table does not exist yet');
      return [];
    }
    throw error;
  }
}

/**
 * Update social account
 */
export async function updateSocialAccount(accountId, userId, updateData) {
  const account = await SocialAccount.findOne({
    where: { id: accountId, userId }
  });

  if (!account) {
    throw new ApiError(404, 'Social account not found');
  }

  await account.update(updateData);

  await logAudit(userId, 'account_updated', 'account', accountId, updateData);

  return account;
}

/**
 * Delete social account
 */
export async function deleteSocialAccount(accountId, userId) {
  const account = await SocialAccount.findOne({
    where: { id: accountId, userId }
  });

  if (!account) {
    throw new ApiError(404, 'Social account not found');
  }

  await account.update({ isActive: false });

  await logAudit(userId, 'account_disconnected', 'account', accountId);

  return account;
}

/**
 * Create social post
 */
export async function createSocialPost(userId, businessId, postData) {
  // Validate scheduled time is in future
  if (postData.scheduledAt) {
    const scheduledTime = new Date(postData.scheduledAt);
    if (scheduledTime <= new Date()) {
      throw new ApiError(400, 'Scheduled time must be in the future');
    }
    postData.status = 'scheduled';
  }

  const post = await SocialPost.create({
    userId,
    businessId,
    ...postData
  });

  // Create post channels if accounts are specified
  if (postData.accountIds && postData.accountIds.length > 0) {
    const channels = postData.accountIds.map(accountId => ({
      postId: post.id,
      accountId,
      status: postData.scheduledAt ? 'pending' : 'pending',
      scheduledAt: postData.scheduledAt || null
    }));

    await SocialPostChannel.bulkCreate(channels);
  }

  await logAudit(userId, 'post_created', 'post', post.id, {
    status: post.status,
    scheduledAt: post.scheduledAt
  });

  return post;
}

/**
 * Get social posts with filters
 */
export async function getSocialPosts(userId, businessId, filters = {}) {
  try {
    const { Op } = await import('sequelize');
    
    const where = { userId };
    if (businessId) {
      where.businessId = businessId;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const posts = await SocialPost.findAll({
      where,
      include: [
        {
          model: SocialPostChannel,
          as: 'channels',
          required: false,
          include: [
            {
              model: SocialAccount,
              as: 'account',
              required: false
            }
          ]
        }
      ],
      order: [['scheduledAt', 'DESC'], ['createdAt', 'DESC']],
      limit: filters.limit || 50,
      offset: filters.offset || 0
    });

    return posts;
  } catch (error) {
    // If table doesn't exist yet, return empty array
    if (error.name === 'SequelizeDatabaseError' && error.message.includes("doesn't exist")) {
      console.warn('Social posts table does not exist yet');
      return [];
    }
    throw error;
  }
}

/**
 * Update social post (only if draft or scheduled)
 */
export async function updateSocialPost(postId, userId, updateData) {
  const post = await SocialPost.findOne({
    where: { id: postId, userId }
  });

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  if (!['draft', 'scheduled'].includes(post.status)) {
    throw new ApiError(400, 'Can only edit draft or scheduled posts');
  }

  // Validate scheduled time
  if (updateData.scheduledAt) {
    const scheduledTime = new Date(updateData.scheduledAt);
    if (scheduledTime <= new Date()) {
      throw new ApiError(400, 'Scheduled time must be in the future');
    }
    updateData.status = 'scheduled';
  }

  await post.update(updateData);

  // Update channels if accountIds provided
  if (updateData.accountIds) {
    await SocialPostChannel.destroy({ where: { postId } });
    const channels = updateData.accountIds.map(accountId => ({
      postId: post.id,
      accountId,
      status: updateData.scheduledAt ? 'pending' : 'pending',
      scheduledAt: updateData.scheduledAt || null
    }));
    await SocialPostChannel.bulkCreate(channels);
  }

  await logAudit(userId, 'post_updated', 'post', postId, updateData);

  return post;
}

/**
 * Delete social post
 */
export async function deleteSocialPost(postId, userId) {
  const post = await SocialPost.findOne({
    where: { id: postId, userId }
  });

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  if (!['draft', 'scheduled'].includes(post.status)) {
    throw new ApiError(400, 'Can only delete draft or scheduled posts');
  }

  await post.destroy();

  await logAudit(userId, 'post_deleted', 'post', postId);

  return { success: true };
}

/**
 * Get social templates
 */
export async function getSocialTemplates(userId, businessId, filters = {}) {
  try {
    const where = {
      [Op.or]: [
        { userId: null, isSystem: true },
        { userId, isSystem: false }
      ],
      isActive: true
    };

    if (businessId) {
      where.businessId = businessId;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    return await SocialTemplate.findAll({
      where,
      order: [['isSystem', 'DESC'], ['category', 'ASC'], ['name', 'ASC']]
    });
  } catch (error) {
    // If table doesn't exist yet, return empty array
    if (error.name === 'SequelizeDatabaseError' && error.message.includes("doesn't exist")) {
      console.warn('Social templates table does not exist yet');
      return [];
    }
    throw error;
  }
}

/**
 * Create social template
 */
export async function createSocialTemplate(userId, businessId, templateData) {
  const template = await SocialTemplate.create({
    userId,
    businessId,
    isSystem: false,
    ...templateData
  });

  await logAudit(userId, 'template_created', 'template', template.id);

  return template;
}

/**
 * Upload media asset
 */
export async function createMediaAsset(userId, businessId, fileData) {
  const asset = await MediaAsset.create({
    userId,
    businessId,
    ...fileData
  });

  await logAudit(userId, 'media_uploaded', 'media', asset.id, {
    fileName: fileData.fileName,
    fileType: fileData.fileType
  });

  return asset;
}

/**
 * Get media assets
 */
export async function getMediaAssets(userId, businessId, filters = {}) {
  const where = { userId };
  if (businessId) {
    where.businessId = businessId;
  }
  if (filters.fileType) {
    where.fileType = filters.fileType;
  }

  return await MediaAsset.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50
  });
}

/**
 * Get post with details
 */
export async function getPostDetails(postId, userId) {
  const { Op } = await import('sequelize');
  
  const post = await SocialPost.findOne({
    where: { id: postId, userId },
    include: [
      {
        model: SocialPostChannel,
        as: 'channels',
        include: [
          {
            model: SocialAccount,
            as: 'account'
          },
          {
            model: PublishAttempt,
            as: 'attempts',
            order: [['attemptNumber', 'DESC']],
            limit: 10
          }
        ]
      }
    ]
  });

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  return post;
}

/**
 * Retry failed post
 */
export async function retryFailedPost(postChannelId, userId, maxAttempts = 3) {
  const channel = await SocialPostChannel.findOne({
    where: { id: postChannelId },
    include: [
      {
        model: SocialPost,
        as: 'post',
        where: { userId }
      }
    ]
  });

  if (!channel) {
    throw new ApiError(404, 'Post channel not found');
  }

  if (channel.status !== 'failed') {
    throw new ApiError(400, 'Can only retry failed posts');
  }

  // Check attempt count
  const attemptCount = await PublishAttempt.count({
    where: { postChannelId }
  });

  if (attemptCount >= maxAttempts) {
    throw new ApiError(400, `Maximum retry attempts (${maxAttempts}) reached`);
  }

  // Reset channel status
  await channel.update({
    status: 'pending',
    errorMessage: null
  });

  await logAudit(userId, 'post_retry', 'post', channel.postId, {
    postChannelId,
    attemptNumber: attemptCount + 1
  });

  return channel;
}

/**
 * Log audit trail
 */
async function logAudit(userId, action, entityType, entityId, details = null) {
  try {
    await SocialAuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      details
    });
  } catch (error) {
    console.error('Error logging audit:', error);
    // Don't throw - audit logging shouldn't break the flow
  }
}

// Model associations are set up in models/index.js

export {
  SocialAccount,
  SocialPost,
  SocialPostChannel,
  SocialTemplate,
  MediaAsset,
  PublishAttempt,
  SocialAuditLog
};

