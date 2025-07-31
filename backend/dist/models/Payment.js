"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const paymentSchema = new mongoose_1.Schema({
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
        enum: ['razorpay', 'paypal'],
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
        type: mongoose_1.Schema.Types.Mixed,
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
paymentSchema.virtual('formattedAmount').get(function () {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.currency
    }).format(this.amount / 100); // Assuming amount is stored in cents
});
// Method to check if payment is successful
paymentSchema.methods.isSuccessful = function () {
    return this.status === 'completed';
};
// Method to check if payment can be refunded
paymentSchema.methods.canBeRefunded = function () {
    if (this.status !== 'completed')
        return false;
    // Can only refund within 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.createdAt > thirtyDaysAgo;
};
// Pre-save middleware to set refundedAt when status changes to refunded
paymentSchema.pre('save', function (next) {
    if (this.isModified('status') && this.status === 'refunded' && !this.refundedAt) {
        this.refundedAt = new Date();
    }
    next();
});
// Ensure virtual fields are serialized
paymentSchema.set('toJSON', { virtuals: true });
exports.Payment = mongoose_1.default.model('Payment', paymentSchema);
//# sourceMappingURL=Payment.js.map