// src/controllers/profile.controller.js
import { User } from '../models/User.js';
import { Business } from '../models/Business.js';
import { Customer } from '../models/Customer.js';
import { UserSession } from '../models/UserSession.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { UserPlan } from '../models/UserPlan.js';
import { Plan } from '../models/Plan.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { Op } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to log activity
const logActivity = async (userId, action, description, ipAddress, userAgent, metadata = null) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      description,
      ipAddress,
      userAgent,
      metadata: metadata ? JSON.stringify(metadata) : null
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Render profile page
export const renderProfilePage = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).redirect('/login');
    }

    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).redirect('/login');
    }
    
    // Get current plan separately
    let userPlan = null;
    try {
      userPlan = await UserPlan.findOne({
        where: { userId: req.user.id, isCurrent: true },
        include: [{ model: Plan, as: 'plan', required: false }]
      });
    } catch (planError) {
      console.error('Error fetching user plan:', planError);
    }

    const userData = {
      id: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      avatar: user.avatar || user.avatarUrl || null,
      phone: user.phone || user.phoneNo || '',
      role: user.role || 'shop_owner',
      timezone: user.timezone || 'Asia/Kolkata',
      language: user.language || 'en',
      notificationPreferences: user.notificationPreferences || {},
      twoFactorEnabled: user.twoFactorEnabled || false,
      updatedAt: user.updatedAt,
      plan: userPlan?.plan || null
    };

    res.render('profile', {
      title: 'Profile Settings',
      user: userData,
      activePage: 'profile',
      apiBase: res.locals.apiBase || 'http://localhost:3002/api/v1'
    });
  } catch (error) {
    console.error('Error rendering profile page:', error);
    res.status(500).send('Failed to load profile page');
  }
};

// Get profile data (API)
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Get current plan separately
  const userPlan = await UserPlan.findOne({
    where: { userId: req.user.id, isCurrent: true },
    include: [{ model: Plan, as: 'plan', required: false }]
  });

  const userData = {
    id: user.id,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    avatar: user.avatar || user.avatarUrl || null,
    phone: user.phone || user.phoneNo || '',
    role: user.role || 'shop_owner',
    timezone: user.timezone || 'Asia/Kolkata',
    language: user.language || 'en',
    notificationPreferences: user.notificationPreferences || {},
    twoFactorEnabled: user.twoFactorEnabled || false,
    updatedAt: user.updatedAt,
    plan: userPlan?.plan || null
  };

  return res.status(200).json(new ApiResponse(200, userData, 'Profile fetched successfully'));
});

// Update profile
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, phone, timezone, language } = req.body;

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (phone !== undefined) updateData.phone = phone;
  if (timezone !== undefined) updateData.timezone = timezone;
  if (language !== undefined) updateData.language = language;

  await user.update(updateData);

  // Log activity
  await logActivity(
    userId,
    'profile_updated',
    'Profile information updated',
    req.ip,
    req.headers['user-agent']
  );

  return res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
});

// Upload avatar
export const uploadAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ success: false, message: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' });
  }

  // Validate file size (2MB)
  if (req.file.size > 2 * 1024 * 1024) {
    return res.status(400).json({ success: false, message: 'File size exceeds 2MB limit' });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../../public/uploads/avatars');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const fileExt = path.extname(req.file.originalname);
    const fileName = `avatar_${userId}_${Date.now()}${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file
    await fs.writeFile(filePath, req.file.buffer);

    // Delete old avatar if exists
    if (user.avatar || user.avatarUrl) {
      const oldPath = path.join(__dirname, '../../public', (user.avatar || user.avatarUrl).replace(/^\//, ''));
      try {
        await fs.unlink(oldPath);
      } catch (error) {
        // Ignore if file doesn't exist
      }
    }

    // Update user avatar
    const avatarUrl = `/uploads/avatars/${fileName}`;
    await user.update({ avatar: avatarUrl });

    // Log activity
    await logActivity(
      userId,
      'avatar_updated',
      'Profile avatar updated',
      req.ip,
      req.headers['user-agent']
    );

    return res.status(200).json(new ApiResponse(200, { avatar: avatarUrl }, 'Avatar uploaded successfully'));
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload avatar', error: error.message });
  }
});

// Remove avatar
export const removeAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Delete avatar file if exists
  if (user.avatar || user.avatarUrl) {
    const oldPath = path.join(__dirname, '../../public', (user.avatar || user.avatarUrl).replace(/^\//, ''));
    try {
      await fs.unlink(oldPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  await user.update({ avatar: null });

  // Log activity
  await logActivity(
    userId,
    'avatar_removed',
    'Profile avatar removed',
    req.ip,
    req.headers['user-agent']
  );

  return res.status(200).json(new ApiResponse(200, null, 'Avatar removed successfully'));
});

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword, confirmPassword, logoutAllDevices } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'All password fields are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'New passwords do not match' });
  }

  // Password strength validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character'
    });
  }

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Verify current password
  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
  if (!isPasswordCorrect) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  // Update password
  await user.update({ password: newPassword });

  // Logout all devices if requested
  if (logoutAllDevices) {
    await UserSession.update(
      { isActive: false },
      { where: { userId, isActive: true } }
    );
  }

  // Log activity
  await logActivity(
    userId,
    'password_changed',
    logoutAllDevices ? 'Password changed and logged out from all devices' : 'Password changed',
    req.ip,
    req.headers['user-agent']
  );

  return res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
});

// Get active sessions
export const getActiveSessions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const currentSessionToken = req.cookies?.sessionToken;

  const sessions = await UserSession.findAll({
    where: {
      userId,
      isActive: true
    },
    order: [['lastActiveAt', 'DESC']]
  });

  // Mark current session
  const sessionsWithCurrent = sessions.map(session => {
    const sessionData = session.toJSON();
    // Note: We can't directly compare tokens, but we can check if it's the most recent one
    sessionData.isCurrent = false; // Will be set by frontend based on lastActiveAt
    return sessionData;
  });

  return res.status(200).json(new ApiResponse(200, sessionsWithCurrent, 'Active sessions fetched successfully'));
});

// Logout session
export const logoutSession = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.params;

  if (sessionId === 'all') {
    await UserSession.update(
      { isActive: false },
      { where: { userId, isActive: true } }
    );
    
    await logActivity(
      userId,
      'sessions_logged_out',
      'Logged out from all devices',
      req.ip,
      req.headers['user-agent']
    );
  } else {
    const session = await UserSession.findOne({
      where: { id: sessionId, userId }
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    await session.update({ isActive: false });
    
    await logActivity(
      userId,
      'session_logged_out',
      'Logged out from a device',
      req.ip,
      req.headers['user-agent'],
      { sessionId }
    );
  }

  return res.status(200).json(new ApiResponse(200, null, 'Session logged out successfully'));
});

// Get workspace/business info
export const getWorkspaceInfo = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const businesses = await Business.findAll({
    where: { ownerId: userId },
    order: [['createdAt', 'ASC']]
  });

  const customerCount = await Customer.count({ where: { userId } });

  // Get user plan and limits
  const userPlan = await UserPlan.findOne({
    where: { userId, isCurrent: true },
    include: [{ model: Plan, as: 'plan', required: false }]
  });

  const plan = userPlan?.plan || null;
  const planLimits = {
    maxBusinesses: plan?.maxBusinesses || 1,
    maxCustomers: plan?.maxCustomers || 50,
    businessesUsed: businesses.length,
    customersUsed: customerCount
  };

  return res.status(200).json(new ApiResponse(200, {
    businesses,
    defaultBusiness: businesses[0] || null,
    planLimits,
    plan
  }, 'Workspace info fetched successfully'));
});

// Update notification preferences
export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const preferences = req.body;

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  await user.update({ notificationPreferences: preferences });

  await logActivity(
    userId,
    'notifications_updated',
    'Notification preferences updated',
    req.ip,
    req.headers['user-agent']
  );

  return res.status(200).json(new ApiResponse(200, preferences, 'Notification preferences updated successfully'));
});

// Get activity logs
export const getActivityLogs = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit = 50 } = req.query;

  const logs = await ActivityLog.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit)
  });

  return res.status(200).json(new ApiResponse(200, logs, 'Activity logs fetched successfully'));
});

// Get billing info
export const getBillingInfo = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const userPlan = await UserPlan.findOne({
    where: { userId, isCurrent: true },
    include: [{ model: Plan, as: 'plan', required: false }]
  });

  if (!userPlan) {
    return res.status(404).json({ success: false, message: 'No active plan found' });
  }

  const billingInfo = {
    plan: userPlan.plan,
    startDate: userPlan.startDate,
    endDate: userPlan.endDate,
    status: userPlan.status,
    renewalDate: userPlan.endDate
  };

  return res.status(200).json(new ApiResponse(200, billingInfo, 'Billing info fetched successfully'));
});


