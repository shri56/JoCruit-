import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/types';
export declare const errorHandler: (error: Error | AppError, req: Request, res: Response, next: NextFunction) => void;
