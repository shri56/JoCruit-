"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config();
const logger_1 = __importDefault(require("@/utils/logger"));
const database_1 = __importDefault(require("@/config/database"));
const errorHandler_1 = require("@/middleware/errorHandler");
// Import routes (will create these next)
const auth_1 = __importDefault(require("@/routes/auth"));
const users_1 = __importDefault(require("@/routes/users"));
const interviews_1 = __importDefault(require("@/routes/interviews"));
const questions_1 = __importDefault(require("@/routes/questions"));
const reports_1 = __importDefault(require("@/routes/reports"));
const payments_1 = __importDefault(require("@/routes/payments"));
const uploads_1 = __importDefault(require("@/routes/uploads"));
const webhooks_1 = __importDefault(require("@/routes/webhooks"));
const admin_1 = __importDefault(require("@/routes/admin"));
class Server {
    constructor() {
        this.gracefulShutdown = async (signal) => {
            logger_1.default.info(`Received ${signal}. Starting graceful shutdown...`);
            try {
                await database_1.default.disconnect();
                logger_1.default.info('Database disconnected');
                process.exit(0);
            }
            catch (error) {
                logger_1.default.error('Error during graceful shutdown:', error);
                process.exit(1);
            }
        };
        this.app = (0, express_1.default)();
        this.port = parseInt(process.env.PORT || '3001');
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    initializeMiddleware() {
        // Trust proxy for rate limiting behind reverse proxy
        this.app.set('trust proxy', 1);
        // Security middleware
        this.app.use((0, helmet_1.default)({
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
        this.app.use((0, cors_1.default)(corsOptions));
        // Compression
        this.app.use((0, compression_1.default)());
        // Rate limiting
        const limiter = (0, express_rate_limit_1.default)({
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
        this.app.use((0, morgan_1.default)('combined'));
        // Body parsing middleware
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Serve static files
        this.app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                success: true,
                message: 'Server is healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV,
                database: database_1.default.getConnectionStatus() ? 'connected' : 'disconnected'
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
    initializeRoutes() {
        // API routes
        this.app.use('/api/auth', auth_1.default);
        this.app.use('/api/users', users_1.default);
        this.app.use('/api/interviews', interviews_1.default);
        this.app.use('/api/questions', questions_1.default);
        this.app.use('/api/reports', reports_1.default);
        this.app.use('/api/payments', payments_1.default);
        this.app.use('/api/uploads', uploads_1.default);
        this.app.use('/api/webhooks', webhooks_1.default);
        this.app.use('/api/admin', admin_1.default);
        // 404 handler for API routes
        this.app.use('/api/*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'API endpoint not found'
            });
        });
        // Serve frontend in production
        if (process.env.NODE_ENV === 'production') {
            const frontendPath = path_1.default.join(process.cwd(), '..', 'JoCrruit', 'dist');
            this.app.use(express_1.default.static(frontendPath));
            this.app.get('*', (req, res) => {
                res.sendFile(path_1.default.join(frontendPath, 'index.html'));
            });
        }
        else {
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
    initializeErrorHandling() {
        this.app.use(errorHandler_1.errorHandler);
    }
    async start() {
        try {
            // Connect to database
            await database_1.default.connect();
            // Create indexes
            await database_1.default.createIndexes();
            // Seed initial data
            await database_1.default.seedInitialData();
            // Start server
            this.app.listen(this.port, () => {
                logger_1.default.info(`Server started successfully`, {
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
   Database: ${database_1.default.getConnectionStatus() ? '✅ Connected' : '❌ Disconnected'}
   CORS Origin: ${process.env.CORS_ORIGIN}
   Rate Limit: ${process.env.RATE_LIMIT_MAX_REQUESTS} requests per ${parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 60000} minutes

📖 Documentation: http://localhost:${this.port}/api
        `);
            });
            // Graceful shutdown handlers
            process.on('SIGTERM', this.gracefulShutdown);
            process.on('SIGINT', this.gracefulShutdown);
        }
        catch (error) {
            logger_1.default.error('Failed to start server:', error);
            process.exit(1);
        }
    }
}
// Create and start server
const server = new Server();
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught Exception:', error);
    process.exit(1);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Start the server
server.start().catch((error) => {
    logger_1.default.error('Failed to start server:', error);
    process.exit(1);
});
exports.default = server;
//# sourceMappingURL=server.js.map