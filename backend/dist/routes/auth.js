"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("@/models");
const auth_1 = require("@/middleware/auth");
const EmailService_1 = __importDefault(require("@/services/EmailService"));
const logger_1 = __importDefault(require("@/utils/logger"));
const router = (0, express_1.Router)();
/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { email, password, firstName, lastName, role = 'candidate' } = req.body;
        // Check if user already exists
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exists with this email'
            });
        }
        // Generate email verification token
        const emailVerificationToken = crypto_1.default.randomBytes(32).toString('hex');
        // Create new user
        const user = new models_1.User({
            email,
            password,
            firstName,
            lastName,
            role: role === 'admin' ? 'candidate' : role, // Prevent admin registration
            emailVerificationToken,
            isEmailVerified: process.env.REQUIRE_EMAIL_VERIFICATION !== 'true' // Auto-verify if not required
        });
        await user.save();
        // Generate tokens
        const accessToken = (0, auth_1.generateToken)(user._id);
        const refreshToken = (0, auth_1.generateRefreshToken)(user._id);
        // Send welcome email
        try {
            await EmailService_1.default.sendWelcomeEmail(user.email, user.firstName, process.env.REQUIRE_EMAIL_VERIFICATION === 'true' ? emailVerificationToken : undefined);
        }
        catch (emailError) {
            logger_1.default.error('Failed to send welcome email:', emailError);
            // Don't fail registration due to email error
        }
        logger_1.default.info('User registered successfully', {
            userId: user._id,
            email: user.email,
            role: user.role
        });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified
                },
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
});
/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').exists().withMessage('Password is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { email, password } = req.body;
        // Find user and include password
        const user = await models_1.User.findOne({ email }).select('+password +subscription');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        // Check if email verification is required
        if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.isEmailVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email before logging in'
            });
        }
        // Generate tokens
        const accessToken = (0, auth_1.generateToken)(user._id);
        const refreshToken = (0, auth_1.generateRefreshToken)(user._id);
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        logger_1.default.info('User logged in successfully', {
            userId: user._id,
            email: user.email
        });
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    subscription: user.subscription,
                    lastLogin: user.lastLogin
                },
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});
/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', [
    (0, express_validator_1.body)('refreshToken').exists().withMessage('Refresh token is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { refreshToken } = req.body;
        // Verify refresh token
        const decoded = (0, auth_1.verifyRefreshToken)(refreshToken);
        // Check if user exists
        const user = await models_1.User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
        // Generate new access token
        const newAccessToken = (0, auth_1.generateToken)(user._id);
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: newAccessToken
            }
        });
    }
    catch (error) {
        logger_1.default.error('Token refresh error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
        });
    }
});
/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email', [
    (0, express_validator_1.body)('token').exists().withMessage('Verification token is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { token } = req.body;
        // Find user with verification token
        const user = await models_1.User.findOne({ emailVerificationToken: token });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }
        // Update user verification status
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();
        logger_1.default.info('Email verified successfully', {
            userId: user._id,
            email: user.email
        });
        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Email verification failed'
        });
    }
});
/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { email } = req.body;
        // Find user
        const user = await models_1.User.findOne({ email });
        if (!user) {
            // Don't reveal if user exists or not
            return res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent'
            });
        }
        // Generate reset token
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        // Save reset token
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = resetExpires;
        await user.save();
        // Send reset email
        try {
            await EmailService_1.default.sendPasswordReset(user.email, user.firstName, resetToken);
        }
        catch (emailError) {
            logger_1.default.error('Failed to send password reset email:', emailError);
            // Clear reset token if email fails
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset email'
            });
        }
        logger_1.default.info('Password reset email sent', {
            userId: user._id,
            email: user.email
        });
        res.json({
            success: true,
            message: 'Password reset link sent to your email'
        });
    }
    catch (error) {
        logger_1.default.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process password reset request'
        });
    }
});
/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', [
    (0, express_validator_1.body)('token').exists().withMessage('Reset token is required'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { token, password } = req.body;
        // Find user with valid reset token
        const user = await models_1.User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() }
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }
        // Update password
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        logger_1.default.info('Password reset successfully', {
            userId: user._id,
            email: user.email
        });
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Password reset failed'
        });
    }
});
/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated user)
 * @access  Private
 */
router.post('/change-password', auth_1.authenticate, [
    (0, express_validator_1.body)('currentPassword').exists().withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { currentPassword, newPassword } = req.body;
        const user = await models_1.User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        // Update password
        user.password = newPassword;
        await user.save();
        logger_1.default.info('Password changed successfully', {
            userId: user._id,
            email: user.email
        });
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
});
/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const user = await models_1.User.findById(req.user._id).select('+subscription');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    avatar: user.avatar,
                    phone: user.phone,
                    location: user.location,
                    skills: user.skills,
                    experience: user.experience,
                    education: user.education,
                    isEmailVerified: user.isEmailVerified,
                    subscription: user.subscription,
                    preferences: user.preferences,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user information'
        });
    }
});
/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', auth_1.authenticate, async (req, res) => {
    try {
        // In a real implementation, you might want to blacklist the token
        // For now, we'll just return success as logout is handled client-side
        logger_1.default.info('User logged out', {
            userId: req.user._id,
            email: req.user.email
        });
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map