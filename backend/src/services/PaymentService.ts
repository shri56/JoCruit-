// PAYMENT INTEGRATION DISABLED FOR NOW
// This service is kept for future use but all payment processing is currently disabled
// To re-enable: uncomment the payment logic and add proper Stripe/Razorpay keys

import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { Payment } from '@/models';
import { IPayment, IUser } from '@/types';
import logger from '@/utils/logger';

class PaymentService {
  private stripe: Stripe;
  private razorpay: Razorpay;

  constructor() {
    // Initialize Stripe
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-12-18.acacia'
    });

    // Initialize Razorpay
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || ''
    });
  }

  /**
   * Create Stripe payment intent
   */
  async createStripePaymentIntent(params: {
    amount: number;
    currency: string;
    userId: string;
    plan: string;
    billingPeriod: 'monthly' | 'yearly';
    metadata?: Record<string, any>;
  }): Promise<{
    paymentIntent: Stripe.PaymentIntent;
    clientSecret: string;
    payment: IPayment;
  }> {
    try {
      const { amount, currency, userId, plan, billingPeriod, metadata } = params;

      // Create payment intent in Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          userId,
          plan,
          billingPeriod,
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true
        }
      });

      // Create payment record in database
      const payment = new Payment({
        userId,
        amount: amount * 100, // Store in cents
        currency: currency.toUpperCase(),
        status: 'pending',
        paymentMethod: 'stripe',
        paymentIntentId: paymentIntent.id,
        plan,
        billingPeriod,
        description: `${plan} plan subscription (${billingPeriod})`,
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          ...metadata
        }
      });

      await payment.save();

      logger.info('Stripe payment intent created', {
        paymentIntentId: paymentIntent.id,
        userId,
        amount,
        currency,
        plan
      });

      return {
        paymentIntent,
        clientSecret: paymentIntent.client_secret!,
        payment
      };

    } catch (error) {
      logger.error('Error creating Stripe payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Create Razorpay order
   */
  async createRazorpayOrder(params: {
    amount: number;
    currency: string;
    userId: string;
    plan: string;
    billingPeriod: 'monthly' | 'yearly';
    metadata?: Record<string, any>;
  }): Promise<{
    order: any;
    payment: IPayment;
  }> {
    try {
      const { amount, currency, userId, plan, billingPeriod, metadata } = params;

      // Create order in Razorpay
      const order = await this.razorpay.orders.create({
        amount: amount * 100, // Convert to paise for INR
        currency: currency.toUpperCase(),
        notes: {
          userId,
          plan,
          billingPeriod,
          ...metadata
        }
      });

      // Create payment record in database
      const payment = new Payment({
        userId,
        amount: amount * 100, // Store in paise
        currency: currency.toUpperCase(),
        status: 'pending',
        paymentMethod: 'razorpay',
        paymentIntentId: order.id,
        plan,
        billingPeriod,
        description: `${plan} plan subscription (${billingPeriod})`,
        metadata: {
          razorpayOrderId: order.id,
          ...metadata
        }
      });

      await payment.save();

      logger.info('Razorpay order created', {
        orderId: order.id,
        userId,
        amount,
        currency,
        plan
      });

      return {
        order,
        payment
      };

    } catch (error) {
      logger.error('Error creating Razorpay order:', error);
      throw new Error('Failed to create Razorpay order');
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(params: {
    userId: string;
    plan: 'basic' | 'premium' | 'enterprise';
    billingPeriod: 'monthly' | 'yearly';
    paymentMethod: 'stripe' | 'razorpay';
    couponCode?: string;
  }): Promise<{
    subscription: any;
    payment: IPayment;
    discountAmount?: number;
  }> {
    try {
      const { userId, plan, billingPeriod, paymentMethod, couponCode } = params;

      // Get plan pricing
      const planDetails = this.getPlanDetails(plan, billingPeriod);
      let amount = planDetails.amount;
      let discountAmount = 0;

      // Apply coupon if provided
      if (couponCode) {
        const discount = await this.validateAndApplyCoupon(couponCode, amount);
        amount = discount.finalAmount;
        discountAmount = discount.discountAmount;
      }

      if (paymentMethod === 'stripe') {
        // Create Stripe subscription
        const customer = await this.getOrCreateStripeCustomer(userId);
        
        const subscription = await this.stripe.subscriptions.create({
          customer: customer.id,
          items: [{
            price_data: {
              currency: planDetails.currency,
              product_data: {
                name: `${plan} Plan`,
                description: `${plan} subscription plan`
              },
              unit_amount: amount * 100,
              recurring: {
                interval: billingPeriod === 'monthly' ? 'month' : 'year'
              }
            }
          }],
          payment_behavior: 'default_incomplete',
          payment_settings: {
            save_default_payment_method: 'on_subscription'
          },
          expand: ['latest_invoice.payment_intent']
        });

        // Create payment record
        const payment = new Payment({
          userId,
          amount: amount * 100,
          currency: planDetails.currency.toUpperCase(),
          status: 'pending',
          paymentMethod: 'stripe',
          paymentIntentId: subscription.id,
          subscriptionId: subscription.id,
          plan,
          billingPeriod,
          description: `${plan} plan subscription (${billingPeriod})`,
          metadata: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customer.id,
            couponCode,
            discountAmount
          }
        });

        await payment.save();

        return {
          subscription,
          payment,
          discountAmount
        };

      } else {
        // Create Razorpay subscription
        const razorpayPlan = await this.getOrCreateRazorpayPlan(plan, billingPeriod, amount);
        
        const subscription = await this.razorpay.subscriptions.create({
          plan_id: razorpayPlan.id,
          customer_notify: 1,
          quantity: 1,
          total_count: billingPeriod === 'monthly' ? 12 : 1,
          notes: {
            userId,
            plan,
            billingPeriod,
            couponCode
          }
        });

        // Create payment record
        const payment = new Payment({
          userId,
          amount: amount * 100,
          currency: planDetails.currency.toUpperCase(),
          status: 'pending',
          paymentMethod: 'razorpay',
          paymentIntentId: subscription.id,
          subscriptionId: subscription.id,
          plan,
          billingPeriod,
          description: `${plan} plan subscription (${billingPeriod})`,
          metadata: {
            razorpaySubscriptionId: subscription.id,
            razorpayPlanId: razorpayPlan.id,
            couponCode,
            discountAmount
          }
        });

        await payment.save();

        return {
          subscription,
          payment,
          discountAmount
        };
      }

    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    try {
      logger.info('Processing Stripe webhook', { 
        type: event.type, 
        id: event.id 
      });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
          break;

        default:
          logger.info('Unhandled Stripe webhook event type', { type: event.type });
      }

    } catch (error) {
      logger.error('Error handling Stripe webhook:', error);
      throw error;
    }
  }

  /**
   * Handle Razorpay webhook
   */
  async handleRazorpayWebhook(event: any): Promise<void> {
    try {
      logger.info('Processing Razorpay webhook', { 
        event: event.event, 
        id: event.payload?.payment?.entity?.id 
      });

      switch (event.event) {
        case 'payment.captured':
          await this.handleRazorpayPaymentCaptured(event.payload.payment.entity);
          break;

        case 'payment.failed':
          await this.handleRazorpayPaymentFailed(event.payload.payment.entity);
          break;

        case 'subscription.charged':
          await this.handleRazorpaySubscriptionCharged(event.payload.subscription.entity);
          break;

        case 'subscription.cancelled':
          await this.handleRazorpaySubscriptionCancelled(event.payload.subscription.entity);
          break;

        default:
          logger.info('Unhandled Razorpay webhook event', { event: event.event });
      }

    } catch (error) {
      logger.error('Error handling Razorpay webhook:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, paymentMethod: 'stripe' | 'razorpay'): Promise<void> {
    try {
      if (paymentMethod === 'stripe') {
        await this.stripe.subscriptions.cancel(subscriptionId);
      } else {
        await this.razorpay.subscriptions.cancel(subscriptionId);
      }

      // Update payment record
      await Payment.updateMany(
        { subscriptionId },
        { status: 'cancelled' }
      );

      logger.info('Subscription cancelled', { subscriptionId, paymentMethod });

    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentId: string, reason?: string): Promise<void> {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (!payment.canBeRefunded()) {
        throw new Error('Payment cannot be refunded');
      }

      if (payment.paymentMethod === 'stripe') {
        await this.stripe.refunds.create({
          payment_intent: payment.paymentIntentId,
          reason: 'requested_by_customer'
        });
      } else {
        await this.razorpay.payments.refund(payment.paymentIntentId, {
          amount: payment.amount,
          speed: 'normal',
          notes: {
            reason: reason || 'Customer requested refund'
          }
        });
      }

      // Update payment record
      payment.status = 'refunded';
      payment.refundReason = reason;
      await payment.save();

      logger.info('Refund processed', { 
        paymentId, 
        amount: payment.amount, 
        paymentMethod: payment.paymentMethod 
      });

    } catch (error) {
      logger.error('Error processing refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(params: {
    startDate: Date;
    endDate: Date;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    try {
      const { startDate, endDate, groupBy = 'day' } = params;

      const analytics = await Payment.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: groupBy === 'day' ? '%Y-%m-%d' : 
                       groupBy === 'week' ? '%Y-%U' : '%Y-%m',
                date: '$createdAt'
              }
            },
            totalRevenue: { $sum: '$amount' },
            totalTransactions: { $sum: 1 },
            averageAmount: { $avg: '$amount' },
            plans: {
              $push: '$plan'
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      logger.info('Payment analytics generated', {
        startDate,
        endDate,
        groupBy,
        recordCount: analytics.length
      });

      return analytics;

    } catch (error) {
      logger.error('Error generating payment analytics:', error);
      throw new Error('Failed to generate payment analytics');
    }
  }

  // Private helper methods

  private getPlanDetails(plan: string, billingPeriod: string) {
    const pricing = {
      basic: { monthly: 29, yearly: 290 },
      premium: { monthly: 99, yearly: 990 },
      enterprise: { monthly: 299, yearly: 2990 }
    };

    return {
      amount: pricing[plan as keyof typeof pricing][billingPeriod as keyof typeof pricing.basic],
      currency: 'usd'
    };
  }

  private async validateAndApplyCoupon(couponCode: string, amount: number) {
    // Simple coupon validation - in production, you'd have a coupons table
    const coupons: { [key: string]: { type: 'percentage' | 'fixed', value: number } } = {
      'SAVE20': { type: 'percentage', value: 20 },
      'FIRST100': { type: 'fixed', value: 100 },
      'STUDENT50': { type: 'percentage', value: 50 }
    };

    const coupon = coupons[couponCode.toUpperCase()];
    if (!coupon) {
      throw new Error('Invalid coupon code');
    }

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = Math.round((amount * coupon.value) / 100);
    } else {
      discountAmount = Math.min(coupon.value, amount);
    }

    return {
      discountAmount,
      finalAmount: amount - discountAmount
    };
  }

  private async getOrCreateStripeCustomer(userId: string) {
    // In production, you'd store customer ID in user record
    const customers = await this.stripe.customers.list({
      metadata: { userId },
      limit: 1
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    return await this.stripe.customers.create({
      metadata: { userId }
    });
  }

  private async getOrCreateRazorpayPlan(plan: string, billingPeriod: string, amount: number) {
    // In production, you'd cache or store plan IDs
    const planId = `${plan}_${billingPeriod}_${amount}`;

    try {
      return await this.razorpay.plans.fetch(planId);
    } catch {
      return await this.razorpay.plans.create({
        id: planId,
        item: {
          name: `${plan} Plan`,
          amount: amount * 100,
          currency: 'INR'
        },
        period: billingPeriod === 'monthly' ? 'monthly' : 'yearly',
        interval: 1
      });
    }
  }

  // Webhook handlers

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
    if (payment) {
      payment.status = 'completed';
      await payment.save();
      
      // Update user subscription status
      await this.updateUserSubscription(payment.userId, payment.plan, payment.billingPeriod);
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
    if (payment) {
      payment.status = 'failed';
      await payment.save();
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    if (invoice.subscription) {
      const payment = await Payment.findOne({ subscriptionId: invoice.subscription });
      if (payment) {
        await this.updateUserSubscription(payment.userId, payment.plan, payment.billingPeriod);
      }
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    logger.warn('Invoice payment failed', { invoiceId: invoice.id });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const payment = await Payment.findOne({ subscriptionId: subscription.id });
    if (payment) {
      // Update subscription status based on Stripe subscription status
      if (subscription.status === 'active') {
        await this.updateUserSubscription(payment.userId, payment.plan, payment.billingPeriod);
      }
    }
  }

  private async handleSubscriptionCancelled(subscription: Stripe.Subscription) {
    await Payment.updateMany(
      { subscriptionId: subscription.id },
      { status: 'cancelled' }
    );
  }

  private async handleRazorpayPaymentCaptured(payment: any) {
    const paymentRecord = await Payment.findOne({ paymentIntentId: payment.order_id });
    if (paymentRecord) {
      paymentRecord.status = 'completed';
      await paymentRecord.save();
      
      await this.updateUserSubscription(paymentRecord.userId, paymentRecord.plan, paymentRecord.billingPeriod);
    }
  }

  private async handleRazorpayPaymentFailed(payment: any) {
    const paymentRecord = await Payment.findOne({ paymentIntentId: payment.order_id });
    if (paymentRecord) {
      paymentRecord.status = 'failed';
      await paymentRecord.save();
    }
  }

  private async handleRazorpaySubscriptionCharged(subscription: any) {
    // Handle successful subscription charge
    logger.info('Razorpay subscription charged', { subscriptionId: subscription.id });
  }

  private async handleRazorpaySubscriptionCancelled(subscription: any) {
    await Payment.updateMany(
      { subscriptionId: subscription.id },
      { status: 'cancelled' }
    );
  }

  private async updateUserSubscription(userId: string, plan: string, billingPeriod: string) {
    const { User } = await import('@/models');
    
    const user = await User.findById(userId);
    if (user) {
      const endDate = new Date();
      if (billingPeriod === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      user.subscription = {
        plan: plan as any,
        status: 'active',
        startDate: new Date(),
        endDate
      };

      await user.save();
      
      logger.info('User subscription updated', { userId, plan, billingPeriod });
    }
  }
}

export default new PaymentService();