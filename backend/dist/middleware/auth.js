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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateApiKey = exports.verifyRefreshToken = exports.generateRefreshToken = exports.generateToken = exports.optionalAuth = exports.checkPlanLimits = exports.requireActiveSubscription = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("@/models");
const logger_1 = __importDefault(require("@/utils/logger"));
/**
 * Middleware to authenticate JWT tokens
 */
const authenticate = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Get user from database
        const user = await models_1.User.findById(decoded.userId).select('+subscription');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token - user not found'
            });
        }
        // Check if user is active/verified if required
        if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.isEmailVerified) {
            return res.status(401).json({
                success: false,
                message: 'Email verification required'
            });
        }
        // Attach user to request
        req.user = user;
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        logger_1.default.debug('User authenticated', { userId: user._id, email: user.email });
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        logger_1.default.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};
exports.authenticate = authenticate;
/**
 * Middleware to authorize specific roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }
        next();
    };
};
exports.authorize = authorize;
/**
 * Middleware to check subscription status
 */
const requireActiveSubscription = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    // Admin users bypass subscription checks
    if (req.user.role === 'admin') {
        return next();
    }
    const subscription = req.user.subscription;
    // Allow free tier access
    if (!subscription || subscription.plan === 'free') {
        return next();
    }
    // Check if subscription is active and not expired
    if (subscription.status !== 'active' || subscription.endDate < new Date()) {
        return res.status(402).json({
            success: false,
            message: 'Active subscription required',
            data: {
                currentPlan: subscription?.plan || 'free',
                status: subscription?.status || 'none',
                endDate: subscription?.endDate
            }
        });
    }
    next();
};
exports.requireActiveSubscription = requireActiveSubscription;
/**
 * Middleware to check subscription plan limits
 */
const checkPlanLimits = (feature) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        // Admin users bypass limits
        if (req.user.role === 'admin') {
            return next();
        }
        try {
            const limits = req.user.getPlanLimits();
            switch (feature) {
                case 'interviews':
                    if (limits.interviews > 0) {
                        const { Interview } = await Promise.resolve().then(() => __importStar(require('@/models')));
                        const interviewCount = await Interview.countDocuments({
                            candidateId: req.user._id,
                            createdAt: {
                                $gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
                            }
                        });
                        if (interviewCount >= limits.interviews) {
                            return res.status(402).json({
                                success: false,
                                message: 'Monthly interview limit reached',
                                data: {
                                    limit: limits.interviews,
                                    used: interviewCount,
                                    plan: req.user.subscription?.plan || 'free'
                                }
                            });
                        }
                    }
                    break;
                case 'reports':
                    if (limits.reports > 0) {
                        const { Report } = await Promise.resolve().then(() => __importStar(require('@/models')));
                        const reportCount = await Report.countDocuments({
                            candidateId: req.user._id,
                            createdAt: {
                                $gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
                            }
                        });
                        if (reportCount >= limits.reports) {
                            return res.status(402).json({
                                success: false,
                                message: 'Monthly report limit reached',
                                data: {
                                    limit: limits.reports,
                                    used: reportCount,
                                    plan: req.user.subscription?.plan || 'free'
                                }
                            });
                        }
                    }
                    break;
                default:
                    logger_1.default.warn('Unknown feature for plan limit check:', feature);
            }
            next();
        }
        catch (error) {
            logger_1.default.error('Error checking plan limits:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to check plan limits'
            });
        }
    };
};
exports.checkPlanLimits = checkPlanLimits;
/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await models_1.User.findById(decoded.userId);
            if (user) {
                req.user = user;
            }
        }
        next();
    }
    catch (error) {
        // Continue without authentication
        next();
    }
};
exports.optionalAuth = optionalAuth;
/**
 * Extract token from request headers
 */
function extractToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // Also check query parameter for downloads/streams
    if (req.query.token && typeof req.query.token === 'string') {
        return req.query.token;
    }
    return null;
}
/**
 * Generate JWT token
 */
const generateToken = (userId, expiresIn) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '7d' });
};
exports.generateToken = generateToken;
/**
 * Generate refresh token
 */
const generateRefreshToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, process.env.REFRESH_TOKEN_SECRET);
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Middleware to validate API key for external integrations
 */
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: 'API key required'
        });
    }
    // Simple API key validation - in production, use a more secure method
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    if (!validApiKeys.includes(apiKey)) {
        return res.status(401).json({
            success: false,
            message: 'Invalid API key'
        });
    }
    next();
};
exports.validateApiKey = validateApiKey;
//# sourceMappingURL=auth.js.map