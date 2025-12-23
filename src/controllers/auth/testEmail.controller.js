// src/controllers/auth/testEmail.controller.js
import { sendDocumentEmail } from '../../utils/emailService.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

/**
 * Test email sending endpoint (for debugging)
 */
export const testEmail = asyncHandler(async (req, res) => {
  const { to } = req.body;
  const testEmail = to || process.env.SMTP_USER;

  if (!testEmail) {
    return res.status(400).json({ 
      error: 'Email address required',
      message: 'Please provide an email address to test'
    });
  }

  console.log('═══════════════════════════════════════');
  console.log('TEST EMAIL SENDING');
  console.log('═══════════════════════════════════════');
  console.log('To:', testEmail);
  console.log('SMTP Config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    from: process.env.SMTP_FROM
  });
  console.log('═══════════════════════════════════════');

  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Test Email</title>
    </head>
    <body>
      <h2>Test Email from Mini CRM 360</h2>
      <p>This is a test email to verify SMTP configuration.</p>
      <p>If you received this email, your SMTP settings are working correctly.</p>
      <p>Time: ${new Date().toISOString()}</p>
    </body>
    </html>
  `;

  try {
    const emailSent = await sendDocumentEmail({
      to: testEmail,
      subject: 'Test Email - Mini CRM 360',
      html: testHtml
    });

    if (emailSent) {
      return res.status(200).json({ 
        success: true,
        message: `Test email sent successfully to ${testEmail}. Please check your inbox (and spam folder).`,
        email: testEmail
      });
    } else {
      return res.status(500).json({ 
        error: 'Failed to send test email',
        message: 'Check server logs for details',
        email: testEmail
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    return res.status(500).json({ 
      error: 'Email sending failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

