"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = __importDefault(require("@/utils/logger"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
class EmailService {
    constructor() {
        this.templates = new Map();
        // Initialize nodemailer transporter
        this.transporter = nodemailer_1.default.createTransporter({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        // Set templates directory
        this.templatesDir = path_1.default.join(process.cwd(), 'src', 'templates', 'email');
        this.loadEmailTemplates();
    }
    /**
     * Send email with options
     */
    async sendEmail(options) {
        try {
            const { to, subject, html, text, attachments, template, data } = options;
            let emailHtml = html;
            let emailText = text;
            // Use template if specified
            if (template && this.templates.has(template)) {
                const templateFn = this.templates.get(template);
                emailHtml = templateFn(data || {});
                // Generate text version if not provided
                if (!text) {
                    emailText = this.htmlToText(emailHtml);
                }
            }
            const mailOptions = {
                from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
                to: Array.isArray(to) ? to.join(', ') : to,
                subject,
                html: emailHtml,
                text: emailText,
                attachments
            };
            const info = await this.transporter.sendMail(mailOptions);
            logger_1.default.info('Email sent successfully', {
                to: mailOptions.to,
                subject,
                messageId: info.messageId,
                template
            });
        }
        catch (error) {
            logger_1.default.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }
    /**
     * Send welcome email to new users
     */
    async sendWelcomeEmail(userEmail, userName, verificationToken) {
        try {
            const verificationUrl = verificationToken
                ? `${process.env.CORS_ORIGIN}/verify-email?token=${verificationToken}`
                : null;
            await this.sendEmail({
                to: userEmail,
                subject: 'Welcome to AI Interview Bot!',
                template: 'welcome',
                data: {
                    userName,
                    verificationUrl,
                    supportEmail: process.env.FROM_EMAIL,
                    loginUrl: `${process.env.CORS_ORIGIN}/login`
                }
            });
            logger_1.default.info('Welcome email sent', { userEmail, userName });
        }
        catch (error) {
            logger_1.default.error('Error sending welcome email:', error);
            throw error;
        }
    }
    /**
     * Send email verification
     */
    async sendEmailVerification(userEmail, userName, verificationToken) {
        try {
            const verificationUrl = `${process.env.CORS_ORIGIN}/verify-email?token=${verificationToken}`;
            await this.sendEmail({
                to: userEmail,
                subject: 'Verify Your Email Address',
                template: 'email-verification',
                data: {
                    userName,
                    verificationUrl,
                    supportEmail: process.env.FROM_EMAIL
                }
            });
            logger_1.default.info('Email verification sent', { userEmail, userName });
        }
        catch (error) {
            logger_1.default.error('Error sending email verification:', error);
            throw error;
        }
    }
    /**
     * Send password reset email
     */
    async sendPasswordReset(userEmail, userName, resetToken) {
        try {
            const resetUrl = `${process.env.CORS_ORIGIN}/reset-password?token=${resetToken}`;
            await this.sendEmail({
                to: userEmail,
                subject: 'Reset Your Password',
                template: 'password-reset',
                data: {
                    userName,
                    resetUrl,
                    supportEmail: process.env.FROM_EMAIL,
                    expiryHours: 24
                }
            });
            logger_1.default.info('Password reset email sent', { userEmail, userName });
        }
        catch (error) {
            logger_1.default.error('Error sending password reset email:', error);
            throw error;
        }
    }
    /**
     * Send interview scheduled notification
     */
    async sendInterviewScheduled(params) {
        try {
            const { userEmail, userName, interviewTitle, position, scheduledAt, interviewId } = params;
            const interviewUrl = `${process.env.CORS_ORIGIN}/interview/${interviewId}`;
            const formattedDate = scheduledAt.toLocaleDateString();
            const formattedTime = scheduledAt.toLocaleTimeString();
            await this.sendEmail({
                to: userEmail,
                subject: `Interview Scheduled: ${position}`,
                template: 'interview-scheduled',
                data: {
                    userName,
                    interviewTitle,
                    position,
                    scheduledDate: formattedDate,
                    scheduledTime: formattedTime,
                    interviewUrl,
                    supportEmail: process.env.FROM_EMAIL
                }
            });
            logger_1.default.info('Interview scheduled email sent', { userEmail, interviewId });
        }
        catch (error) {
            logger_1.default.error('Error sending interview scheduled email:', error);
            throw error;
        }
    }
    /**
     * Send interview completed notification with report
     */
    async sendInterviewCompleted(params) {
        try {
            const { userEmail, userName, interviewTitle, position, score, reportUrl, reportBuffer } = params;
            const attachments = [];
            if (reportBuffer) {
                attachments.push({
                    filename: `interview-report-${Date.now()}.pdf`,
                    content: reportBuffer,
                    contentType: 'application/pdf'
                });
            }
            await this.sendEmail({
                to: userEmail,
                subject: `Interview Completed: ${position}`,
                template: 'interview-completed',
                data: {
                    userName,
                    interviewTitle,
                    position,
                    score,
                    scoreGrade: this.getScoreGrade(score),
                    reportUrl,
                    dashboardUrl: `${process.env.CORS_ORIGIN}/dashboard`,
                    supportEmail: process.env.FROM_EMAIL
                },
                attachments
            });
            logger_1.default.info('Interview completed email sent', { userEmail, score });
        }
        catch (error) {
            logger_1.default.error('Error sending interview completed email:', error);
            throw error;
        }
    }
    /**
     * Send payment confirmation
     */
    async sendPaymentConfirmation(params) {
        try {
            const { userEmail, userName, plan, amount, currency, billingPeriod, paymentId } = params;
            const formattedAmount = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency.toUpperCase()
            }).format(amount / 100);
            await this.sendEmail({
                to: userEmail,
                subject: 'Payment Confirmation',
                template: 'payment-confirmation',
                data: {
                    userName,
                    plan: plan.charAt(0).toUpperCase() + plan.slice(1),
                    formattedAmount,
                    currency: currency.toUpperCase(),
                    billingPeriod,
                    paymentId,
                    invoiceUrl: `${process.env.CORS_ORIGIN}/invoice/${paymentId}`,
                    supportEmail: process.env.FROM_EMAIL
                }
            });
            logger_1.default.info('Payment confirmation email sent', { userEmail, plan, amount });
        }
        catch (error) {
            logger_1.default.error('Error sending payment confirmation email:', error);
            throw error;
        }
    }
    /**
     * Send subscription expiry warning
     */
    async sendSubscriptionExpiry(params) {
        try {
            const { userEmail, userName, plan, expiryDate, daysLeft } = params;
            const formattedDate = expiryDate.toLocaleDateString();
            const renewUrl = `${process.env.CORS_ORIGIN}/subscription/renew`;
            await this.sendEmail({
                to: userEmail,
                subject: `Subscription Expiring in ${daysLeft} Days`,
                template: 'subscription-expiry',
                data: {
                    userName,
                    plan: plan.charAt(0).toUpperCase() + plan.slice(1),
                    expiryDate: formattedDate,
                    daysLeft,
                    renewUrl,
                    supportEmail: process.env.FROM_EMAIL
                }
            });
            logger_1.default.info('Subscription expiry email sent', { userEmail, daysLeft });
        }
        catch (error) {
            logger_1.default.error('Error sending subscription expiry email:', error);
            throw error;
        }
    }
    /**
     * Send admin notification
     */
    async sendAdminNotification(params) {
        try {
            const { subject, message, data, urgent } = params;
            const adminEmail = process.env.ADMIN_EMAIL;
            if (!adminEmail) {
                logger_1.default.warn('Admin email not configured, skipping notification');
                return;
            }
            const emailSubject = urgent ? `[URGENT] ${subject}` : `[ADMIN] ${subject}`;
            await this.sendEmail({
                to: adminEmail,
                subject: emailSubject,
                template: 'admin-notification',
                data: {
                    subject,
                    message,
                    urgent,
                    timestamp: new Date().toISOString(),
                    additionalData: data ? JSON.stringify(data, null, 2) : null
                }
            });
            logger_1.default.info('Admin notification sent', { subject, urgent });
        }
        catch (error) {
            logger_1.default.error('Error sending admin notification:', error);
            throw error;
        }
    }
    /**
     * Send bulk emails
     */
    async sendBulkEmails(emails) {
        const results = {
            successful: 0,
            failed: 0,
            errors: []
        };
        for (const email of emails) {
            try {
                await this.sendEmail(email);
                results.successful++;
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            catch (error) {
                results.failed++;
                results.errors.push(error instanceof Error ? error.message : 'Unknown error');
            }
        }
        logger_1.default.info('Bulk email sending completed', results);
        return results;
    }
    /**
     * Test email configuration
     */
    async testEmailConfiguration() {
        try {
            await this.transporter.verify();
            logger_1.default.info('Email configuration verified successfully');
            return true;
        }
        catch (error) {
            logger_1.default.error('Email configuration verification failed:', error);
            return false;
        }
    }
    /**
     * Load email templates
     */
    loadEmailTemplates() {
        try {
            // Create templates directory if it doesn't exist
            if (!fs_1.default.existsSync(this.templatesDir)) {
                fs_1.default.mkdirSync(this.templatesDir, { recursive: true });
                this.createDefaultTemplates();
                return;
            }
            const templateFiles = fs_1.default.readdirSync(this.templatesDir)
                .filter(file => file.endsWith('.hbs'));
            for (const file of templateFiles) {
                const templateName = path_1.default.basename(file, '.hbs');
                const templatePath = path_1.default.join(this.templatesDir, file);
                const templateContent = fs_1.default.readFileSync(templatePath, 'utf8');
                this.templates.set(templateName, handlebars_1.default.compile(templateContent));
                logger_1.default.debug('Email template loaded', { templateName });
            }
            logger_1.default.info('Email templates loaded', { count: this.templates.size });
        }
        catch (error) {
            logger_1.default.error('Error loading email templates:', error);
            // Create default templates as fallback
            this.createDefaultTemplates();
        }
    }
    /**
     * Create default email templates
     */
    createDefaultTemplates() {
        const defaultTemplates = {
            'welcome': `
        <h2>Welcome to AI Interview Bot, {{userName}}!</h2>
        <p>Thank you for joining us. We're excited to help you ace your next interview!</p>
        {{#if verificationUrl}}
        <p><a href="{{verificationUrl}}">Click here to verify your email</a></p>
        {{/if}}
        <p><a href="{{loginUrl}}">Get Started</a></p>
        <p>If you have any questions, contact us at {{supportEmail}}</p>
      `,
            'email-verification': `
        <h2>Verify Your Email Address</h2>
        <p>Hi {{userName}},</p>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="{{verificationUrl}}">Verify Email</a></p>
        <p>If you didn't create an account, please ignore this email.</p>
      `,
            'password-reset': `
        <h2>Reset Your Password</h2>
        <p>Hi {{userName}},</p>
        <p>You requested to reset your password. Click the link below:</p>
        <p><a href="{{resetUrl}}">Reset Password</a></p>
        <p>This link will expire in {{expiryHours}} hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
            'interview-scheduled': `
        <h2>Interview Scheduled</h2>
        <p>Hi {{userName}},</p>
        <p>Your interview "{{interviewTitle}}" for {{position}} has been scheduled.</p>
        <p><strong>Date:</strong> {{scheduledDate}}</p>
        <p><strong>Time:</strong> {{scheduledTime}}</p>
        <p><a href="{{interviewUrl}}">Take Interview</a></p>
        <p>Good luck!</p>
      `,
            'interview-completed': `
        <h2>Interview Completed</h2>
        <p>Hi {{userName}},</p>
        <p>You've completed the interview "{{interviewTitle}}" for {{position}}.</p>
        <p><strong>Your Score:</strong> {{score}}% ({{scoreGrade}})</p>
        {{#if reportUrl}}
        <p><a href="{{reportUrl}}">View Detailed Report</a></p>
        {{/if}}
        <p><a href="{{dashboardUrl}}">View Dashboard</a></p>
      `,
            'payment-confirmation': `
        <h2>Payment Confirmation</h2>
        <p>Hi {{userName}},</p>
        <p>Thank you for your payment!</p>
        <p><strong>Plan:</strong> {{plan}}</p>
        <p><strong>Amount:</strong> {{formattedAmount}}</p>
        <p><strong>Billing Period:</strong> {{billingPeriod}}</p>
        <p><strong>Payment ID:</strong> {{paymentId}}</p>
        {{#if invoiceUrl}}
        <p><a href="{{invoiceUrl}}">Download Invoice</a></p>
        {{/if}}
      `,
            'subscription-expiry': `
        <h2>Subscription Expiring Soon</h2>
        <p>Hi {{userName}},</p>
        <p>Your {{plan}} subscription will expire in {{daysLeft}} days ({{expiryDate}}).</p>
        <p><a href="{{renewUrl}}">Renew Subscription</a></p>
        <p>Don't miss out on our premium features!</p>
      `,
            'admin-notification': `
        <h2>{{#if urgent}}[URGENT] {{/if}}Admin Notification</h2>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Message:</strong> {{message}}</p>
        <p><strong>Timestamp:</strong> {{timestamp}}</p>
        {{#if additionalData}}
        <h3>Additional Data:</h3>
        <pre>{{additionalData}}</pre>
        {{/if}}
      `
        };
        // Ensure templates directory exists
        if (!fs_1.default.existsSync(this.templatesDir)) {
            fs_1.default.mkdirSync(this.templatesDir, { recursive: true });
        }
        // Create template files
        Object.entries(defaultTemplates).forEach(([name, content]) => {
            const filePath = path_1.default.join(this.templatesDir, `${name}.hbs`);
            fs_1.default.writeFileSync(filePath, content.trim());
            // Compile and store template
            this.templates.set(name, handlebars_1.default.compile(content));
        });
        logger_1.default.info('Default email templates created', { count: Object.keys(defaultTemplates).length });
    }
    /**
     * Convert HTML to plain text
     */
    htmlToText(html) {
        return html
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
            .replace(/&amp;/g, '&') // Replace &amp; with &
            .replace(/&lt;/g, '<') // Replace &lt; with <
            .replace(/&gt;/g, '>') // Replace &gt; with >
            .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
            .trim();
    }
    /**
     * Get score grade
     */
    getScoreGrade(score) {
        if (score >= 90)
            return 'A+';
        if (score >= 80)
            return 'A';
        if (score >= 70)
            return 'B';
        if (score >= 60)
            return 'C';
        if (score >= 50)
            return 'D';
        return 'F';
    }
}
exports.default = new EmailService();
//# sourceMappingURL=EmailService.js.map