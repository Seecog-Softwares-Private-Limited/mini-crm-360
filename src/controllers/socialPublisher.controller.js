// src/controllers/socialPublisher.controller.js
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as socialPublisherService from '../services/socialPublisher.service.js';
import { MediaAsset } from '../models/MediaAsset.js';
import { Business } from '../models/Business.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Render Social Publisher page
export const renderSocialPublisherPage = async (req, res) => {
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

    // Get user's businesses - handle errors gracefully
    let businesses = [];
    try {
      businesses = await Business.findAll({
        where: { ownerId: req.user.id },
        order: [['name', 'ASC']]
      });
    } catch (businessError) {
      console.error('Error loading businesses:', businessError.message);
      businesses = [];
    }

    res.render('social-publisher', {
      title: 'Social Publisher',
      user,
      activePage: 'social-publisher',
      businesses: businesses || [],
      apiBase: res.locals.apiBase || '/api/v1'
    });
  } catch (error) {
    console.error('Error rendering social publisher page:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      userId: req.user?.id
    });
    res.status(500).send(`Failed to load social publisher page: ${error.message}`);
  }
};

// ============ SOCIAL ACCOUNTS ============

// Get user's social accounts
export const getSocialAccounts = asyncHandler(async (req, res) => {
  const { businessId } = req.query;
  const accounts = await socialPublisherService.getUserSocialAccounts(
    req.user.id,
    businessId ? parseInt(businessId) : null
  );

  return res.status(200).json(
    new ApiResponse(200, accounts, 'Social accounts fetched successfully')
  );
});

// Create social account
export const createSocialAccount = asyncHandler(async (req, res) => {
  const { businessId, platform, accountType, accountName, accountId, accessToken, refreshToken, tokenExpiresAt, metadata } = req.body;

  const account = await socialPublisherService.createSocialAccount(
    req.user.id,
    businessId || null,
    {
      platform,
      accountType,
      accountName,
      accountId,
      accessToken,
      refreshToken,
      tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : null,
      metadata
    }
  );

  return res.status(201).json(
    new ApiResponse(201, account, 'Social account connected successfully')
  );
});

// Update social account
export const updateSocialAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const account = await socialPublisherService.updateSocialAccount(
    parseInt(id),
    req.user.id,
    updateData
  );

  return res.status(200).json(
    new ApiResponse(200, account, 'Social account updated successfully')
  );
});

// Delete social account
export const deleteSocialAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await socialPublisherService.deleteSocialAccount(
    parseInt(id),
    req.user.id
  );

  return res.status(200).json(
    new ApiResponse(200, null, 'Social account disconnected successfully')
  );
});

// ============ SOCIAL POSTS ============

// Get social posts
export const getSocialPosts = asyncHandler(async (req, res) => {
  const { businessId, status, limit, offset } = req.query;

  const posts = await socialPublisherService.getSocialPosts(
    req.user.id,
    businessId ? parseInt(businessId) : null,
    {
      status,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    }
  );

  return res.status(200).json(
    new ApiResponse(200, posts, 'Social posts fetched successfully')
  );
});

// Get post details
export const getPostDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await socialPublisherService.getPostDetails(
    parseInt(id),
    req.user.id
  );

  return res.status(200).json(
    new ApiResponse(200, post, 'Post details fetched successfully')
  );
});

// Create social post
export const createSocialPost = asyncHandler(async (req, res) => {
  const { businessId, title, content, scheduledAt, accountIds, templateId, mediaUrls, metadata } = req.body;

  // Validate content length if accounts specified
  if (accountIds && accountIds.length > 0) {
    // Get platforms for accounts
    const accounts = await socialPublisherService.getUserSocialAccounts(req.user.id, businessId);
    const selectedAccounts = accounts.filter(a => accountIds.includes(a.id));
    const platforms = [...new Set(selectedAccounts.map(a => a.platform))];

    const validation = socialPublisherService.validateContentLength(content, platforms);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Content validation failed',
        errors: validation.errors
      });
    }
  }

  const post = await socialPublisherService.createSocialPost(
    req.user.id,
    businessId || null,
    {
      title,
      content,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      accountIds,
      templateId,
      mediaUrls,
      metadata
    }
  );

  return res.status(201).json(
    new ApiResponse(201, post, 'Social post created successfully')
  );
});

// Update social post
export const updateSocialPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, scheduledAt, accountIds, mediaUrls, metadata } = req.body;

  // Validate content length if accounts specified
  if (accountIds && accountIds.length > 0) {
    const accounts = await socialPublisherService.getUserSocialAccounts(req.user.id, req.body.businessId);
    const selectedAccounts = accounts.filter(a => accountIds.includes(a.id));
    const platforms = [...new Set(selectedAccounts.map(a => a.platform))];

    const validation = socialPublisherService.validateContentLength(content, platforms);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Content validation failed',
        errors: validation.errors
      });
    }
  }

  const post = await socialPublisherService.updateSocialPost(
    parseInt(id),
    req.user.id,
    {
      title,
      content,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      accountIds,
      mediaUrls,
      metadata
    }
  );

  return res.status(200).json(
    new ApiResponse(200, post, 'Social post updated successfully')
  );
});

// Delete social post
export const deleteSocialPost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await socialPublisherService.deleteSocialPost(
    parseInt(id),
    req.user.id
  );

  return res.status(200).json(
    new ApiResponse(200, null, 'Social post deleted successfully')
  );
});

// Retry failed post
export const retryFailedPost = asyncHandler(async (req, res) => {
  const { postChannelId } = req.params;
  const { maxAttempts } = req.body;

  const channel = await socialPublisherService.retryFailedPost(
    parseInt(postChannelId),
    req.user.id,
    maxAttempts || 3
  );

  return res.status(200).json(
    new ApiResponse(200, channel, 'Post retry initiated successfully')
  );
});

// ============ TEMPLATES ============

// Get templates
export const getSocialTemplates = asyncHandler(async (req, res) => {
  const { businessId, category } = req.query;

  const templates = await socialPublisherService.getSocialTemplates(
    req.user.id,
    businessId ? parseInt(businessId) : null,
    { category }
  );

  return res.status(200).json(
    new ApiResponse(200, templates, 'Templates fetched successfully')
  );
});

// Create template
export const createSocialTemplate = asyncHandler(async (req, res) => {
  const { businessId, name, category, content, mediaUrls, tags } = req.body;

  const template = await socialPublisherService.createSocialTemplate(
    req.user.id,
    businessId || null,
    {
      name,
      category,
      content,
      mediaUrls,
      tags
    }
  );

  return res.status(201).json(
    new ApiResponse(201, template, 'Template created successfully')
  );
});

// ============ MEDIA ============

// Upload media
export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const { businessId } = req.body;
  const file = req.file;

  // Determine file type
  let fileType = 'document';
  if (file.mimetype.startsWith('image/')) {
    fileType = 'image';
  } else if (file.mimetype.startsWith('video/')) {
    fileType = 'video';
  }

  // Generate file URL
  const fileUrl = `/uploads/media/${file.filename}`;
  const filePath = path.join(__dirname, '../../public', fileUrl);

  const asset = await socialPublisherService.createMediaAsset(
    req.user.id,
    businessId || null,
    {
      fileName: file.filename,
      originalFileName: file.originalname,
      filePath,
      fileUrl,
      fileType,
      mimeType: file.mimetype,
      fileSize: file.size,
      width: null, // Could extract from image metadata
      height: null,
      metadata: {}
    }
  );

  return res.status(201).json(
    new ApiResponse(201, asset, 'Media uploaded successfully')
  );
});

// Get media assets
export const getMediaAssets = asyncHandler(async (req, res) => {
  const { businessId, fileType, limit } = req.query;

  const assets = await socialPublisherService.getMediaAssets(
    req.user.id,
    businessId ? parseInt(businessId) : null,
    {
      fileType,
      limit: limit ? parseInt(limit) : 50
    }
  );

  return res.status(200).json(
    new ApiResponse(200, assets, 'Media assets fetched successfully')
  );
});

// Get platform limits
export const getPlatformLimits = asyncHandler(async (req, res) => {
  const limits = {
    facebook: socialPublisherService.getPlatformLimit('facebook'),
    linkedin: socialPublisherService.getPlatformLimit('linkedin'),
    twitter: socialPublisherService.getPlatformLimit('twitter'),
    instagram: socialPublisherService.getPlatformLimit('instagram'),
    whatsapp: socialPublisherService.getPlatformLimit('whatsapp')
  };

  return res.status(200).json(
    new ApiResponse(200, limits, 'Platform limits fetched successfully')
  );
});

