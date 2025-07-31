"use strict";
// PAYMENT INTEGRATION - RAZORPAY ONLY
// Stripe has been removed, only Razorpay payment processing is available
// To re-enable: add proper Razorpay keys
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const razorpay_1 = __importDefault(require("razorpay"));
const models_1 = require("@/models");
const logger_1 = __importDefault(require("@/utils/logger"));
class PaymentService {
    constructor() {
        // Initialize Razorpay only
        this.razorpay = new razorpay_1.default({
            key_id: process.env.RAZORPAY_KEY_ID || '',
            key_secret: process.env.RAZORPAY_KEY_SECRET || '',
        });
    }
    /**
     * Create Razorpay order
     */
    async createRazorpayOrder(params) {
        try {
            const { amount, currency, receipt, userId, plan, billingPeriod } = params;
            // Create order in Razorpay
            const order = await this.razorpay.orders.create({
                amount: amount * 100, // Razorpay expects amount in paise
                currency: currency.toLowerCase(),
                receipt: receipt,
                notes: {
                    userId,
                    plan,
                    billingPeriod,
                },
            });
            // Create payment record in database
            const payment = new models_1.Payment({
                userId,
                amount,
                currency,
                status: 'pending',
                paymentMethod: 'razorpay',
                paymentIntentId: order.id,
                plan,
                billingPeriod,
                description: `${plan} subscription - ${billingPeriod}`,
                metadata: {
                    razorpayOrderId: order.id,
                    plan,
                    billingPeriod,
                },
            });
            await payment.save();
            logger_1.default.info('Razorpay order created', {
                orderId: order.id,
                amount,
                userId,
            });
            return {
                order,
                payment,
            };
        }
        catch (error) {
            logger_1.default.error('Error creating Razorpay order:', error);
            throw new Error('Failed to create payment order');
        }
    }
    /**
     * Verify Razorpay payment
     */
    async verifyRazorpayPayment(params) {
        try {
            const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;
            // Verify signature
            const text = `${razorpayOrderId}|${razorpayPaymentId}`;
            const crypto = require('crypto');
            const signature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
                .update(text)
                .digest('hex');
            if (signature !== razorpaySignature) {
                throw new Error('Invalid payment signature');
            }
            // Update payment record
            const payment = await models_1.Payment.findOne({ 'metadata.razorpayOrderId': razorpayOrderId });
            if (!payment) {
                throw new Error('Payment not found');
            }
            payment.status = 'completed';
            payment.paymentIntentId = razorpayPaymentId;
            payment.metadata = {
                ...payment.metadata,
                razorpayPaymentId,
                razorpaySignature,
            };
            await payment.save();
            logger_1.default.info('Razorpay payment verified', {
                paymentId: payment._id,
                orderId: razorpayOrderId,
            });
            return payment;
        }
        catch (error) {
            logger_1.default.error('Error verifying Razorpay payment:', error);
            throw new Error('Failed to verify payment');
        }
    }
    /**
     * Create subscription (Razorpay only)
     */
    async createSubscription(params) {
        try {
            const { userId, plan, billingPeriod, paymentMethod, couponCode } = params;
            if (paymentMethod !== 'razorpay') {
                throw new Error('Only Razorpay is supported');
            }
            // Calculate amount based on plan and billing period
            const planPrices = {
                basic: { monthly: 999, yearly: 9999 },
                premium: { monthly: 1999, yearly: 19999 },
                enterprise: { monthly: 4999, yearly: 49999 },
            };
            let amount = planPrices[plan][billingPeriod];
            if (couponCode) {
                // Apply coupon discount (implement your coupon logic here)
                amount = Math.round(amount * 0.9); // 10% discount example
            }
            // Create Razorpay subscription
            const subscription = await this.razorpay.subscriptions.create({
                plan_id: `${plan}_${billingPeriod}`, // You'll need to create these plans in Razorpay
                customer_notify: 1,
                total_count: billingPeriod === 'monthly' ? 12 : 1, // 12 months for monthly, 1 for yearly
                notes: {
                    userId,
                    plan,
                    billingPeriod,
                },
            });
            // Create payment record
            const payment = new models_1.Payment({
                userId,
                amount,
                currency: 'INR',
                status: 'pending',
                paymentMethod: 'razorpay',
                paymentIntentId: subscription.id,
                plan,
                billingPeriod,
                description: `${plan} subscription - ${billingPeriod}`,
                metadata: {
                    razorpaySubscriptionId: subscription.id,
                    plan,
                    billingPeriod,
                },
            });
            await payment.save();
            logger_1.default.info('Razorpay subscription created', {
                subscriptionId: subscription.id,
                plan,
                userId,
            });
            return {
                subscription,
                payment,
            };
        }
        catch (error) {
            logger_1.default.error('Error creating Razorpay subscription:', error);
            throw new Error('Failed to create subscription');
        }
    }
    /**
     * Handle Razorpay webhook
     */
    async handleRazorpayWebhook(event) {
        try {
            logger_1.default.info('Processing Razorpay webhook', {
                event: event.event,
                entity: event.entity,
            });
            switch (event.event) {
                case 'payment.captured':
                    await this.handlePaymentCaptured(event.payload.payment.entity);
                    break;
                case 'subscription.activated':
                    await this.handleSubscriptionActivated(event.payload.subscription.entity);
                    break;
                case 'subscription.cancelled':
                    await this.handleSubscriptionCancelled(event.payload.subscription.entity);
                    break;
                default:
                    logger_1.default.info('Unhandled Razorpay webhook event type', { type: event.event });
            }
        }
        catch (error) {
            logger_1.default.error('Error handling Razorpay webhook:', error);
            throw error;
        }
    }
    /**
     * Cancel subscription (Razorpay only)
     */
    async cancelSubscription(subscriptionId, paymentMethod) {
        try {
            if (paymentMethod !== 'razorpay') {
                throw new Error('Only Razorpay is supported');
            }
            await this.razorpay.subscriptions.cancel(subscriptionId);
            logger_1.default.info('Razorpay subscription cancelled', { subscriptionId });
        }
        catch (error) {
            logger_1.default.error('Error cancelling Razorpay subscription:', error);
            throw new Error('Failed to cancel subscription');
        }
    }
    /**
     * Process refund (Razorpay only)
     */
    async processRefund(params) {
        try {
            const { paymentId, amount, reason } = params;
            const payment = await models_1.Payment.findById(paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }
            if (payment.paymentMethod !== 'razorpay') {
                throw new Error('Only Razorpay payments can be refunded');
            }
            const refund = await this.razorpay.payments.refund(payment.paymentIntentId, {
                amount: amount * 100, // Convert to paise
                speed: 'normal',
                notes: {
                    reason,
                },
            });
            // Update payment record
            payment.status = 'refunded';
            payment.metadata = {
                ...payment.metadata,
                refundId: refund.id,
                refundReason: reason,
            };
            await payment.save();
            logger_1.default.info('Razorpay refund processed', {
                refundId: refund.id,
                paymentId,
                amount,
            });
            return refund;
        }
        catch (error) {
            logger_1.default.error('Error processing Razorpay refund:', error);
            throw new Error('Failed to process refund');
        }
    }
    // Private helper methods for webhook handling
    async handlePaymentCaptured(payment) {
        // Update payment status to completed
        const paymentRecord = await models_1.Payment.findOne({ 'metadata.razorpayPaymentId': payment.id });
        if (paymentRecord) {
            paymentRecord.status = 'completed';
            await paymentRecord.save();
        }
    }
    async handleSubscriptionActivated(subscription) {
        // Update subscription status
        const payment = await models_1.Payment.findOne({ 'metadata.razorpaySubscriptionId': subscription.id });
        if (payment) {
            payment.status = 'completed';
            await payment.save();
        }
    }
    async handleSubscriptionCancelled(subscription) {
        // Update subscription status
        const payment = await models_1.Payment.findOne({ 'metadata.razorpaySubscriptionId': subscription.id });
        if (payment) {
            payment.status = 'cancelled';
            await payment.save();
        }
    }
}
exports.default = new PaymentService();
//# sourceMappingURL=PaymentService.js.map