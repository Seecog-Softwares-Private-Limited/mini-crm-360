// src/controllers/auth/forgotPassword.controller.js
import { User } from '../../models/User.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendDocumentEmail } from '../../utils/emailService.js';
import crypto from 'crypto';

/**
 * Request password reset - sends email with reset link
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ 
      error: 'Email is required',
      message: 'Please provide your email address'
    });
  }

  try {
    // Find user by email
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

    // Always return success message (security best practice - don't reveal if email exists)
    const successMessage = 'If an account with that email exists, a password reset link has been sent.';

    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({ 
        success: true,
        message: successMessage
      });
    }

    // Skip social login users
    if (user.socialProvider) {
      console.log(`Password reset requested for social login user: ${email}`);
      return res.status(200).json({ 
        success: true,
        message: successMessage
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to user
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = resetTokenExpires;
    await user.save();

    // Generate reset URL
    const nodeEnv = process.env.NODE_ENV || 'development';
    const port = process.env.PORT || 3002;
    const productionUrl = process.env.PRODUCTION_URL || 'https://petserviceinhome.com';
    const developmentUrl = process.env.DEVELOPMENT_URL || `http://localhost:${port}`;
    const baseUrl = (nodeEnv === 'prod' || nodeEnv === 'production') ? productionUrl : developmentUrl;
    
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Send reset email
    const emailSubject = 'Password Reset Request - Mini CRM 360';
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .email-container {
            background: #ffffff;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .button:hover {
            opacity: 0.9;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 6px;
            padding: 12px;
            margin: 20px 0;
            font-size: 14px;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">Mini CRM 360</div>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello ${user.firstName || 'User'},</p>
            <p>We received a request to reset your password for your Mini CRM 360 account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
            </div>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Mini CRM 360. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('═══════════════════════════════════════');
    console.log('SENDING PASSWORD RESET EMAIL');
    console.log('═══════════════════════════════════════');
    console.log('To:', user.email);
    console.log('Subject:', emailSubject);
    console.log('Reset URL:', resetUrl);
    console.log('Reset Token (first 10 chars):', resetToken.substring(0, 10) + '...');
    console.log('═══════════════════════════════════════');

    const emailSent = await sendDocumentEmail({
      to: user.email,
      subject: emailSubject,
      html: emailHtml
    });

    if (!emailSent) {
      console.error('❌ FAILED to send password reset email to:', user.email);
      console.error('Check SMTP configuration and server logs above');
      // Still return success for security, but log the error
      return res.status(200).json({ 
        success: true,
        message: successMessage,
        debug: process.env.NODE_ENV === 'development' ? 'Email sending failed - check server logs' : undefined
      });
    }

    console.log(`✅ Password reset email sent successfully to: ${user.email}`);
    console.log(`✅ Reset URL: ${resetUrl}`);

    return res.status(200).json({ 
      success: true,
      message: successMessage
    });

  } catch (error) {
    console.error('═══════════════════════════════════════');
    console.error('❌ FORGOT PASSWORD ERROR:');
    console.error('═══════════════════════════════════════');
    console.error('Error:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════');
    // Return success even on error (security best practice)
    return res.status(200).json({ 
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      debug: process.env.NODE_ENV === 'development' ? `Error: ${error.message}` : undefined
    });
  }
});

