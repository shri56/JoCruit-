import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types';
/**
 * Middleware to authenticate JWT tokens
 */
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to authorize specific roles
 */
export declare const authorize: (...roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware to check subscription status
 */
export declare const requireActiveSubscription: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Middleware to check subscription plan limits
 */
export declare const checkPlanLimits: (feature: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Optional authentication - doesn't fail if no token
 */
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Generate JWT token
 */
export declare const generateToken: (userId: string, expiresIn?: string) => string;
/**
 * Generate refresh token
 */
export declare const generateRefreshToken: (userId: string) => string;
/**
 * Verify refresh token
 */
export declare const verifyRefreshToken: (token: string) => any;
/**
 * Middleware to validate API key for external integrations
 */
export declare const validateApiKey: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
