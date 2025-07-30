import mongoose, { Schema } from 'mongoose';
import { IPayment } from '@/types';

const paymentSchema = new Schema<IPayment>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User'
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'],
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
    required: [true, 'Payment status is required']
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'razorpay', 'paypal'],
    required: [true, 'Payment method is required']
  },
  paymentIntentId: {
    type: String,
    required: [true, 'Payment intent ID is required'],
    unique: true
  },
  subscriptionId: {
    type: String
  },
  plan: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    required: [true, 'Subscription plan is required']
  },
  billingPeriod: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: [true, 'Billing period is required']
  },
  description: {
    type: String,
    required: [true, 'Payment description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  refundReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Refund reason cannot exceed 500 characters']
  },
  refundedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ paymentIntentId: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ plan: 1, billingPeriod: 1 });

// Compound indexes for analytics
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ paymentMethod: 1, status: 1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount / 100); // Assuming amount is stored in cents
});

// Method to check if payment is successful
paymentSchema.methods.isSuccessful = function(): boolean {
  return this.status === 'completed';
};

// Method to check if payment can be refunded
paymentSchema.methods.canBeRefunded = function(): boolean {
  if (this.status !== 'completed') return false;
  
  // Can only refund within 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return this.createdAt > thirtyDaysAgo;
};

// Pre-save middleware to set refundedAt when status changes to refunded
paymentSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'refunded' && !this.refundedAt) {
    this.refundedAt = new Date();
  }
  next();
});

// Ensure virtual fields are serialized
paymentSchema.set('toJSON', { virtuals: true });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);