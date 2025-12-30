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
