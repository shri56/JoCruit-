import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@/models';
import { AuthenticatedRequest } from '@/types';
import logger from '@/utils/logger';

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req as Request);
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('+subscription');
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
      return;
    }

    // Check if user is active/verified if required
    if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.isEmailVerified) {
      res.status(401).json({
        success: false,
        message: 'Email verification required'
      });
      return;
    }

    // Attach user to request
    req.user = user;
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.debug('User authenticated', { userId: user._id, email: user.email });
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired'
      });
      return;
    }

    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Middleware to authorize specific roles
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check subscription status
 */
export const requireActiveSubscription = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

/**
 * Middleware to check subscription plan limits
 */
export const checkPlanLimits = (feature: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
            const { Interview } = await import('@/models');
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
            const { Report } = await import('@/models');
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
          logger.warn('Unknown feature for plan limit check:', feature);
      }

      next();
    } catch (error) {
      logger.error('Error checking plan limits:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check plan limits'
      });
    }
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req as Request);
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Extract token from request headers
 */
function extractToken(req: Request): string | null {
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
export const generateToken = (userId: string, expiresIn?: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: expiresIn || '24h' }
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!);
};

/**
 * Middleware to validate API key for external integrations
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
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