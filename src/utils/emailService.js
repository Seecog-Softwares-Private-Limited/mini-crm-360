// src/utils/emailService.js
import nodemailer from 'nodemailer';

const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    NODE_ENV,
} = process.env;

// Fallbacks (in case any env is missing)
const host = process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io';
const port = Number(process.env.SMTP_PORT || 2525); // 587 = STARTTLS, 465 = SSL

console.log('[EmailService] Init with:', {
    host,
    port,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET',
    from: SMTP_FROM,
    env: process.env.NODE_ENV,
    isGmail: host && host.includes('gmail.com'),
});

// Create transporter
// Gmail SMTP configuration:
// - Port 587: STARTTLS (secure: false)
// - Port 465: SSL (secure: true)
const isGmail = host && host.includes('gmail.com');
const isSecurePort = port === 465;
const useSecure = isSecurePort;

// For Gmail, use host/port directly (matching test-nodemailer.js working config)
let transporterConfig;
if (isGmail) {
    transporterConfig = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use STARTTLS for port 587
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false // For development/testing
        }
    };
} else {
    transporterConfig = {
        host,
        port,
        secure: useSecure, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    };
}

const transporter = nodemailer.createTransport(transporterConfig);

console.log('[EmailService] Transporter created:', {
    service: transporterConfig.service,
    host: transporterConfig.host,
    port: transporterConfig.port,
    secure: transporterConfig.secure,
    authUser: transporterConfig.auth?.user
});

// Optional: verify connection at startup
transporter
    .verify()
    .then(() => {
        console.log('[EmailService] ✅ transporter.verify OK, ready to send.');
    })
    .catch((err) => {
        console.error('[EmailService] ❌ transporter.verify FAILED:', {
            name: err.name,
            message: err.message,
            code: err.code,
            stack: err.stack
        });
        console.error('[EmailService] ⚠️  Email sending may fail. Check SMTP credentials.');
    });

/**
 * Simple helper to send email with optional PDF attachment
 *
 * @param {Object} options
 * @param {string} options.to
 * @param {string} [options.cc]
 * @param {string} options.subject
 * @param {string} options.html
 * @param {Buffer} [options.pdfBuffer]
 * @param {string} [options.fileName]
 */
export async function sendDocumentEmail({
    to,
    cc,
    subject,
    html,
    pdfBuffer,
    fileName,
}) {
    if (!to) {
        console.warn(
            '[EmailService] sendDocumentEmail: no "to" address, skipping email.'
        );
        return false;
    }

    const mailOptions = {
        from: SMTP_FROM || '"Seecog Softwares" <seecogonline@gmail.com>',
        to,
        cc,
        subject,
        html: html, // Ensure HTML is passed as-is without modification
        attachments: [],
    };

    if (pdfBuffer) {
        mailOptions.attachments.push({
            filename: fileName || 'document.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf',
        });
    }

    try {
        // Ensure HTML is properly formatted
        if (mailOptions.html && typeof mailOptions.html !== 'string') {
            console.warn('[EmailService] HTML is not a string, converting...');
            mailOptions.html = String(mailOptions.html);
        }

        console.log('[EmailService] Attempting to send email:', {
            to: mailOptions.to,
            subject: mailOptions.subject,
            from: mailOptions.from,
            host: transporter.options.host || transporter.options.service,
            port: transporter.options.port,
            secure: transporter.options.secure,
            service: transporter.options.service
        });
        
        const info = await transporter.sendMail(mailOptions);
        console.log('[EmailService] ✅ sendMail SUCCESS:', {
            messageId: info.messageId,
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected,
        });
        return true;
    } catch (err) {
        console.error('[EmailService] ❌ sendMail ERROR:', {
            name: err.name,
            message: err.message,
            code: err.code,
            command: err.command,
            syscall: err.syscall,
            reason: err.reason,
            stack: err.stack
        });
        return false;
    }
}

/**
 * Send account activation email
 * @param {Object} options
 * @param {string} options.to - User email address
 * @param {string} options.firstName - User first name
 * @param {string} options.activationToken - Activation token
 * @param {string} options.activationUrl - Full activation URL
 */
export async function sendActivationEmail({
    to,
    firstName,
    activationToken,
    activationUrl,
}) {
    if (!to || !activationToken || !activationUrl) {
        console.warn('[EmailService] sendActivationEmail: missing required parameters');
        return false;
    }

    const subject = 'Activate Your Mini CRM 360 Account';
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Activate Your Account</title>
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
                .container {
                    background-color: #ffffff;
                    border-radius: 8px;
                    padding: 30px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 28px;
                    font-weight: bold;
                    color: #667eea;
                    margin-bottom: 10px;
                }
                .title {
                    font-size: 24px;
                    color: #1e293b;
                    margin-bottom: 20px;
                }
                .content {
                    margin-bottom: 30px;
                }
                .button {
                    display: inline-block;
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 600;
                    margin: 20px 0;
                    text-align: center;
                }
                .button:hover {
                    opacity: 0.9;
                }
                .link {
                    word-break: break-all;
                    color: #667eea;
                    text-decoration: none;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    font-size: 14px;
                    color: #64748b;
                    text-align: center;
                }
                .warning {
                    background-color: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">Mini CRM 360</div>
                </div>
                <h1 class="title">Welcome, ${firstName || 'User'}!</h1>
                <div class="content">
                    <p>Thank you for registering with Mini CRM 360. To complete your registration and activate your account, please click the button below:</p>
                    <div style="text-align: center;">
                        <a href="${activationUrl}" class="button">Activate Account</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p><a href="${activationUrl}" class="link">${activationUrl}</a></p>
                    <div class="warning">
                        <strong>⚠️ Important:</strong> This activation link will expire in 24 hours. If you didn't create an account, please ignore this email.
                    </div>
                    <p>If the button doesn't work, you can also activate your account by visiting:</p>
                    <p><a href="${activationUrl}" class="link">${activationUrl}</a></p>
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply to this message.</p>
                    <p>&copy; ${new Date().getFullYear()} Mini CRM 360. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    try {
        const mailOptions = {
            from: SMTP_FROM || '"Mini CRM 360" <noreply@minicrm360.com>',
            to,
            subject,
            html,
        };

        console.log('[EmailService] Sending activation email to:', to);
        const info = await transporter.sendMail(mailOptions);
        console.log('[EmailService] ✅ Activation email sent:', {
            messageId: info.messageId,
            to: info.accepted,
        });
        return true;
    } catch (err) {
        console.error('[EmailService] ❌ Failed to send activation email:', {
            name: err.name,
            message: err.message,
            code: err.code,
        });
        return false;
    }
}
