// src/controllers/auth/resetPassword.controller.js
import { User } from '../../models/User.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import crypto from 'crypto';

/**
 * Reset password with token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, email, password } = req.body;

  if (!token || !email || !password) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      message: 'Token, email, and password are required'
    });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({ 
      error: 'Weak password',
      message: 'Password must be at least 6 characters long'
    });
  }

  try {
    // Find user by email
    const user = await User.findOne({ 
      where: { email: email.toLowerCase().trim() } 
    });

    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid token',
        message: 'Invalid or expired reset token'
      });
    }

    // Check if user has a reset token
    if (!user.passwordResetToken || !user.passwordResetExpires) {
      return res.status(400).json({ 
        error: 'Invalid token',
        message: 'No password reset request found. Please request a new reset link.'
      });
    }

    // Check if token has expired
    if (new Date() > user.passwordResetExpires) {
      // Clear expired token
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      return res.status(400).json({ 
        error: 'Expired token',
        message: 'Password reset link has expired. Please request a new one.'
      });
    }

    // Verify token
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    if (user.passwordResetToken !== resetTokenHash) {
      return res.status(400).json({ 
        error: 'Invalid token',
        message: 'Invalid reset token. Please request a new password reset link.'
      });
    }

    // Update password
    // Note: The password will be hashed by the beforeUpdate hook in the User model
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    console.log(`Password reset successful for user: ${user.email}`);

    return res.status(200).json({ 
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: 'Failed to reset password. Please try again.'
    });
  }
});

/**
 * Verify reset token (for frontend validation)
 */
export const verifyResetToken = asyncHandler(async (req, res) => {
  const { token, email } = req.query;

  if (!token || !email) {
    return res.status(400).json({ 
      valid: false,
      message: 'Token and email are required'
    });
  }

  try {
    const user = await User.findOne({ 
      where: { email: email.toLowerCase().trim() } 
    });

    if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
      return res.status(200).json({ 
        valid: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Check if token has expired
    if (new Date() > user.passwordResetExpires) {
      return res.status(200).json({ 
        valid: false,
        message: 'Reset token has expired'
      });
    }

    // Verify token
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    if (user.passwordResetToken !== resetTokenHash) {
      return res.status(200).json({ 
        valid: false,
        message: 'Invalid reset token'
      });
    }

    return res.status(200).json({ 
      valid: true,
      message: 'Token is valid'
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    return res.status(500).json({ 
      valid: false,
      message: 'Failed to verify token'
    });
  }
});


