import { EmailOptions } from '@/types';
declare class EmailService {
    private transporter;
    private templatesDir;
    private templates;
    constructor();
    /**
     * Send email with options
     */
    sendEmail(options: EmailOptions): Promise<void>;
    /**
     * Send welcome email to new users
     */
    sendWelcomeEmail(userEmail: string, userName: string, verificationToken?: string): Promise<void>;
    /**
     * Send email verification
     */
    sendEmailVerification(userEmail: string, userName: string, verificationToken: string): Promise<void>;
    /**
     * Send password reset email
     */
    sendPasswordReset(userEmail: string, userName: string, resetToken: string): Promise<void>;
    /**
     * Send interview scheduled notification
     */
    sendInterviewScheduled(params: {
        userEmail: string;
        userName: string;
        interviewTitle: string;
        position: string;
        scheduledAt: Date;
        interviewId: string;
    }): Promise<void>;
    /**
     * Send interview completed notification with report
     */
    sendInterviewCompleted(params: {
        userEmail: string;
        userName: string;
        interviewTitle: string;
        position: string;
        score: number;
        reportUrl?: string;
        reportBuffer?: Buffer;
    }): Promise<void>;
    /**
     * Send payment confirmation
     */
    sendPaymentConfirmation(params: {
        userEmail: string;
        userName: string;
        plan: string;
        amount: number;
        currency: string;
        billingPeriod: string;
        paymentId: string;
    }): Promise<void>;
    /**
     * Send subscription expiry warning
     */
    sendSubscriptionExpiry(params: {
        userEmail: string;
        userName: string;
        plan: string;
        expiryDate: Date;
        daysLeft: number;
    }): Promise<void>;
    /**
     * Send admin notification
     */
    sendAdminNotification(params: {
        subject: string;
        message: string;
        data?: Record<string, any>;
        urgent?: boolean;
    }): Promise<void>;
    /**
     * Send bulk emails
     */
    sendBulkEmails(emails: EmailOptions[]): Promise<{
        successful: number;
        failed: number;
        errors: string[];
    }>;
    /**
     * Test email configuration
     */
    testEmailConfiguration(): Promise<boolean>;
    /**
     * Load email templates
     */
    private loadEmailTemplates;
    /**
     * Create default email templates
     */
    private createDefaultTemplates;
    /**
     * Convert HTML to plain text
     */
    private htmlToText;
    /**
     * Get score grade
     */
    private getScoreGrade;
}
declare const _default: EmailService;
export default _default;
