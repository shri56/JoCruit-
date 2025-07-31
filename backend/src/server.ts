import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

import logger from '@/utils/logger';
import database from '@/config/database';
import { errorHandler } from '@/middleware/errorHandler';

// Import routes (will create these next)
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import interviewRoutes from '@/routes/interviews';
import questionRoutes from '@/routes/questions';
import reportRoutes from '@/routes/reports';
import paymentRoutes from '@/routes/payments';
import uploadRoutes from '@/routes/uploads';
import webhookRoutes from '@/routes/webhooks';
import adminRoutes from '@/routes/admin';

class Server {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001');
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Trust proxy for rate limiting behind reverse proxy
    this.app.set('trust proxy', 1);

    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    }));

    // CORS configuration
    const corsOptions = {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Authorization',
        'Accept',
        'Cache-Control',
        'X-API-Key'
      ]
    };

    this.app.use(cors(corsOptions));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api/', limiter);

    // Logging
    this.app.use(morgan('combined'));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Serve static files
    this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        database: database.getConnectionStatus() ? 'connected' : 'disconnected'
      });
    });

    // API info endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        success: true,
        message: 'AI Interview Bot API',
        version: '1.0.0',
        documentation: '/api/docs',
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          interviews: '/api/interviews',
          questions: '/api/questions',
          reports: '/api/reports',
          payments: '/api/payments',
          uploads: '/api/uploads'
        }
      });
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/interviews', interviewRoutes);
    this.app.use('/api/questions', questionRoutes);
    this.app.use('/api/reports', reportRoutes);
    this.app.use('/api/payments', paymentRoutes);
    this.app.use('/api/uploads', uploadRoutes);
    this.app.use('/api/webhooks', webhookRoutes);
    this.app.use('/api/admin', adminRoutes);

    // 404 handler for API routes
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    });

    // Serve frontend in production
    if (process.env.NODE_ENV === 'production') {
      const frontendPath = path.join(process.cwd(), '..', 'JoCrruit', 'dist');
      this.app.use(express.static(frontendPath));
      
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
      });
    } else {
      // Development mode - redirect to frontend dev server
      this.app.get('*', (req, res) => {
        res.json({
          success: true,
          message: 'AI Interview Bot Backend API',
          frontend: process.env.CORS_ORIGIN || 'http://localhost:3000',
          api: `http://localhost:${this.port}/api`
        });
      });
    }
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await database.connect();
      
      // Create indexes
      await database.createIndexes();
      
      // Seed initial data
      await database.seedInitialData();

      // Start server
      this.app.listen(this.port, () => {
        logger.info(`Server started successfully`, {
          port: this.port,
          environment: process.env.NODE_ENV,
          api: `http://localhost:${this.port}/api`,
          health: `http://localhost:${this.port}/health`
        });
        
        console.log(`
🚀 AI Interview Bot Backend Server Started!

📋 Server Details:
   Port: ${this.port}
   Environment: ${process.env.NODE_ENV}
   API URL: http://localhost:${this.port}/api
   Health Check: http://localhost:${this.port}/health

📚 API Endpoints:
   Authentication: /api/auth
   Users: /api/users
   Interviews: /api/interviews
   Questions: /api/questions
   Reports: /api/reports
   Payments: /api/payments
   File Uploads: /api/uploads
   Webhooks: /api/webhooks

🔧 Configuration:
   Database: ${database.getConnectionStatus() ? '✅ Connected' : '❌ Disconnected'}
   CORS Origin: ${process.env.CORS_ORIGIN}
   Rate Limit: ${process.env.RATE_LIMIT_MAX_REQUESTS} requests per ${parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 60000} minutes

📖 Documentation: http://localhost:${this.port}/api
        `);
      });

      // Graceful shutdown handlers
      process.on('SIGTERM', this.gracefulShutdown);
      process.on('SIGINT', this.gracefulShutdown);

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    try {
      await database.disconnect();
      logger.info('Database disconnected');
      
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };
}

// Create and start server
const server = new Server();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
server.start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default server;