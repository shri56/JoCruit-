import { IPayment } from '@/types';
declare class PaymentService {
    private razorpay;
    constructor();
    /**
     * Create Razorpay order
     */
    createRazorpayOrder(params: {
        amount: number;
        currency: string;
        receipt: string;
        userId: string;
        plan: string;
        billingPeriod: string;
    }): Promise<{
        order: any;
        payment: IPayment;
    }>;
    /**
     * Verify Razorpay payment
     */
    verifyRazorpayPayment(params: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    }): Promise<IPayment>;
    /**
     * Create subscription (Razorpay only)
     */
    createSubscription(params: {
        userId: string;
        plan: 'basic' | 'premium' | 'enterprise';
        billingPeriod: 'monthly' | 'yearly';
        paymentMethod: 'razorpay';
        couponCode?: string;
    }): Promise<{
        subscription: any;
        payment: IPayment;
    }>;
    /**
     * Handle Razorpay webhook
     */
    handleRazorpayWebhook(event: any): Promise<void>;
    /**
     * Cancel subscription (Razorpay only)
     */
    cancelSubscription(subscriptionId: string, paymentMethod: 'razorpay'): Promise<void>;
    /**
     * Process refund (Razorpay only)
     */
    processRefund(params: {
        paymentId: string;
        amount: number;
        reason: string;
    }): Promise<any>;
    private handlePaymentCaptured;
    private handleSubscriptionActivated;
    private handleSubscriptionCancelled;
}
declare const _default: PaymentService;
export default _default;
