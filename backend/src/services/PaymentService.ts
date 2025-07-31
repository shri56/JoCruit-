// PAYMENT INTEGRATION - RAZORPAY ONLY
// Stripe has been removed, only Razorpay payment processing is available
// To re-enable: add proper Razorpay keys

import Razorpay from 'razorpay';
import { Payment } from '@/models';
import { IPayment, IUser } from '@/types';
import logger from '@/utils/logger';

class PaymentService {
  private razorpay: Razorpay;

  constructor() {
    // Initialize Razorpay only
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });
  }

  /**
   * Create Razorpay order
   */
  async createRazorpayOrder(params: {
    amount: number;
    currency: string;
    receipt: string;
    userId: string;
    plan: string;
    billingPeriod: string;
  }): Promise<{
    order: any;
    payment: IPayment;
  }> {
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
      const payment = new Payment({
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

      logger.info('Razorpay order created', {
        orderId: order.id,
        amount,
        userId,
      });

      return {
        order,
        payment,
      };
    } catch (error) {
      logger.error('Error creating Razorpay order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Verify Razorpay payment
   */
  async verifyRazorpayPayment(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<IPayment> {
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
      const payment = await Payment.findOne({ 'metadata.razorpayOrderId': razorpayOrderId });
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

      logger.info('Razorpay payment verified', {
        paymentId: payment._id,
        orderId: razorpayOrderId,
      });

      return payment;
    } catch (error) {
      logger.error('Error verifying Razorpay payment:', error);
      throw new Error('Failed to verify payment');
    }
  }

  /**
   * Create subscription (Razorpay only)
   */
  async createSubscription(params: {
    userId: string;
    plan: 'basic' | 'premium' | 'enterprise';
    billingPeriod: 'monthly' | 'yearly';
    paymentMethod: 'razorpay';
    couponCode?: string;
  }): Promise<{
    subscription: any;
    payment: IPayment;
  }> {
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
      const payment = new Payment({
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

      logger.info('Razorpay subscription created', {
        subscriptionId: subscription.id,
        plan,
        userId,
      });

      return {
        subscription,
        payment,
      };
    } catch (error) {
      logger.error('Error creating Razorpay subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Handle Razorpay webhook
   */
  async handleRazorpayWebhook(event: any): Promise<void> {
    try {
      logger.info('Processing Razorpay webhook', {
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
          logger.info('Unhandled Razorpay webhook event type', { type: event.event });
      }
    } catch (error) {
      logger.error('Error handling Razorpay webhook:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription (Razorpay only)
   */
  async cancelSubscription(subscriptionId: string, paymentMethod: 'razorpay'): Promise<void> {
    try {
      if (paymentMethod !== 'razorpay') {
        throw new Error('Only Razorpay is supported');
      }

      await this.razorpay.subscriptions.cancel(subscriptionId);
      logger.info('Razorpay subscription cancelled', { subscriptionId });
    } catch (error) {
      logger.error('Error cancelling Razorpay subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Process refund (Razorpay only)
   */
  async processRefund(params: {
    paymentId: string;
    amount: number;
    reason: string;
  }): Promise<any> {
    try {
      const { paymentId, amount, reason } = params;

      const payment = await Payment.findById(paymentId);
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

      logger.info('Razorpay refund processed', {
        refundId: refund.id,
        paymentId,
        amount,
      });

      return refund;
    } catch (error) {
      logger.error('Error processing Razorpay refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  // Private helper methods for webhook handling
  private async handlePaymentCaptured(payment: any) {
    // Update payment status to completed
    const paymentRecord = await Payment.findOne({ 'metadata.razorpayPaymentId': payment.id });
    if (paymentRecord) {
      paymentRecord.status = 'completed';
      await paymentRecord.save();
    }
  }

  private async handleSubscriptionActivated(subscription: any) {
    // Update subscription status
    const payment = await Payment.findOne({ 'metadata.razorpaySubscriptionId': subscription.id });
    if (payment) {
      payment.status = 'completed';
      await payment.save();
    }
  }

  private async handleSubscriptionCancelled(subscription: any) {
    // Update subscription status
    const payment = await Payment.findOne({ 'metadata.razorpaySubscriptionId': subscription.id });
    if (payment) {
      payment.status = 'failed'; // Use 'failed' instead of 'cancelled' to match the enum
      await payment.save();
    }
  }
}

export default new PaymentService();