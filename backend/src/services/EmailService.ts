import nodemailer from 'nodemailer';
import { EmailOptions, EmailTemplate } from '@/types';
import logger from '@/utils/logger';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

class EmailService {
  private transporter: nodemailer.Transporter;
  private templatesDir: string;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor() {
    this.transporter = nodemailer.createTransport({
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
    this.templatesDir = path.join(process.cwd(), 'src', 'templates', 'email');
    this.loadEmailTemplates();
  }

  /**
   * Send email with options
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const {
        to,
        subject,
        html,
        text,
        attachments,
        template,
        data
      } = options;

      let emailHtml = html;
      let emailText = text;

      // Use template if specified
      if (template && this.templates.has(template)) {
        const templateFn = this.templates.get(template)!;
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

      logger.info('Email sent successfully', {
        to: mailOptions.to,
        subject,
        messageId: info.messageId,
        template
      });

    } catch (error) {
      logger.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(userEmail: string, userName: string, verificationToken?: string): Promise<void> {
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

      logger.info('Welcome email sent', { userEmail, userName });

    } catch (error) {
      logger.error('Error sending welcome email:', error);
      throw error;
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(userEmail: string, userName: string, verificationToken: string): Promise<void> {
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

      logger.info('Email verification sent', { userEmail, userName });

    } catch (error) {
      logger.error('Error sending email verification:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(userEmail: string, userName: string, resetToken: string): Promise<void> {
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

      logger.info('Password reset email sent', { userEmail, userName });

    } catch (error) {
      logger.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Send interview scheduled notification
   */
  async sendInterviewScheduled(params: {
    userEmail: string;
    userName: string;
    interviewTitle: string;
    position: string;
    scheduledAt: Date;
    interviewId: string;
  }): Promise<void> {
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

      logger.info('Interview scheduled email sent', { userEmail, interviewId });

    } catch (error) {
      logger.error('Error sending interview scheduled email:', error);
      throw error;
    }
  }

  /**
   * Send interview completed notification with report
   */
  async sendInterviewCompleted(params: {
    userEmail: string;
    userName: string;
    interviewTitle: string;
    position: string;
    score: number;
    reportUrl?: string;
    reportBuffer?: Buffer;
  }): Promise<void> {
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

      logger.info('Interview completed email sent', { userEmail, score });

    } catch (error) {
      logger.error('Error sending interview completed email:', error);
      throw error;
    }
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(params: {
    userEmail: string;
    userName: string;
    plan: string;
    amount: number;
    currency: string;
    billingPeriod: string;
    paymentId: string;
  }): Promise<void> {
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

      logger.info('Payment confirmation email sent', { userEmail, plan, amount });

    } catch (error) {
      logger.error('Error sending payment confirmation email:', error);
      throw error;
    }
  }

  /**
   * Send subscription expiry warning
   */
  async sendSubscriptionExpiry(params: {
    userEmail: string;
    userName: string;
    plan: string;
    expiryDate: Date;
    daysLeft: number;
  }): Promise<void> {
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

      logger.info('Subscription expiry email sent', { userEmail, daysLeft });

    } catch (error) {
      logger.error('Error sending subscription expiry email:', error);
      throw error;
    }
  }

  /**
   * Send admin notification
   */
  async sendAdminNotification(params: {
    subject: string;
    message: string;
    data?: Record<string, any>;
    urgent?: boolean;
  }): Promise<void> {
    try {
      const { subject, message, data, urgent } = params;
      const adminEmail = process.env.ADMIN_EMAIL;

      if (!adminEmail) {
        logger.warn('Admin email not configured, skipping notification');
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

      logger.info('Admin notification sent', { subject, urgent });

    } catch (error) {
      logger.error('Error sending admin notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails: EmailOptions[]): Promise<{
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const email of emails) {
      try {
        await this.sendEmail(email);
        results.successful++;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        results.failed++;
        results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    logger.info('Bulk email sending completed', results);
    return results;
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email configuration verified successfully');
      return true;
    } catch (error) {
      logger.error('Email configuration verification failed:', error);
      return false;
    }
  }

  /**
   * Load email templates
   */
  private loadEmailTemplates(): void {
    try {
      // Create templates directory if it doesn't exist
      if (!fs.existsSync(this.templatesDir)) {
        fs.mkdirSync(this.templatesDir, { recursive: true });
        this.createDefaultTemplates();
        return;
      }

      const templateFiles = fs.readdirSync(this.templatesDir)
        .filter(file => file.endsWith('.hbs'));

      for (const file of templateFiles) {
        const templateName = path.basename(file, '.hbs');
        const templatePath = path.join(this.templatesDir, file);
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        
        this.templates.set(templateName, handlebars.compile(templateContent));
        
        logger.debug('Email template loaded', { templateName });
      }

      logger.info('Email templates loaded', { count: this.templates.size });

    } catch (error) {
      logger.error('Error loading email templates:', error);
      // Create default templates as fallback
      this.createDefaultTemplates();
    }
  }

  /**
   * Create default email templates
   */
  private createDefaultTemplates(): void {
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
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }

    // Create template files
    Object.entries(defaultTemplates).forEach(([name, content]) => {
      const filePath = path.join(this.templatesDir, `${name}.hbs`);
      fs.writeFileSync(filePath, content.trim());
      
      // Compile and store template
      this.templates.set(name, handlebars.compile(content));
    });

    logger.info('Default email templates created', { count: Object.keys(defaultTemplates).length });
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
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
  private getScoreGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }
}

export default new EmailService();