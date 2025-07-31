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
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("@/utils/logger"));
class Database {
    constructor() {
        this.isConnected = false;
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async connect() {
        if (this.isConnected) {
            logger_1.default.info('Database already connected');
            return;
        }
        try {
            const mongoUri = process.env.MONGODB_URI;
            if (!mongoUri) {
                throw new Error('MONGODB_URI environment variable is not set');
            }
            // Connection options
            const options = {
                maxPoolSize: 10, // Maintain up to 10 socket connections
                serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
                socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
                bufferCommands: false, // Disable mongoose buffering
                bufferMaxEntries: 0, // Disable mongoose buffering
                useNewUrlParser: true,
                useUnifiedTopology: true,
            };
            // Connect to MongoDB
            await mongoose_1.default.connect(mongoUri, options);
            this.isConnected = true;
            logger_1.default.info('Successfully connected to MongoDB', {
                host: mongoose_1.default.connection.host,
                port: mongoose_1.default.connection.port,
                database: mongoose_1.default.connection.name
            });
            // Connection event handlers
            mongoose_1.default.connection.on('error', (error) => {
                logger_1.default.error('MongoDB connection error:', error);
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('disconnected', () => {
                logger_1.default.warn('MongoDB disconnected');
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('reconnected', () => {
                logger_1.default.info('MongoDB reconnected');
                this.isConnected = true;
            });
            // Graceful shutdown
            process.on('SIGINT', async () => {
                await this.disconnect();
                process.exit(0);
            });
        }
        catch (error) {
            logger_1.default.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await mongoose_1.default.connection.close();
            this.isConnected = false;
            logger_1.default.info('Disconnected from MongoDB');
        }
        catch (error) {
            logger_1.default.error('Error disconnecting from MongoDB:', error);
            throw error;
        }
    }
    getConnectionStatus() {
        return this.isConnected && mongoose_1.default.connection.readyState === 1;
    }
    async ping() {
        try {
            await mongoose_1.default.connection.db.admin().ping();
            return true;
        }
        catch (error) {
            logger_1.default.error('Database ping failed:', error);
            return false;
        }
    }
    getStats() {
        if (!this.isConnected) {
            return null;
        }
        return {
            readyState: mongoose_1.default.connection.readyState,
            host: mongoose_1.default.connection.host,
            port: mongoose_1.default.connection.port,
            name: mongoose_1.default.connection.name,
            collections: Object.keys(mongoose_1.default.connection.collections)
        };
    }
    async createIndexes() {
        try {
            logger_1.default.info('Creating database indexes...');
            // User indexes
            await mongoose_1.default.connection.collection('users').createIndex({ email: 1 }, { unique: true });
            await mongoose_1.default.connection.collection('users').createIndex({ role: 1 });
            await mongoose_1.default.connection.collection('users').createIndex({ 'subscription.plan': 1 });
            await mongoose_1.default.connection.collection('users').createIndex({ createdAt: -1 });
            // Interview indexes
            await mongoose_1.default.connection.collection('interviews').createIndex({ candidateId: 1 });
            await mongoose_1.default.connection.collection('interviews').createIndex({ status: 1 });
            await mongoose_1.default.connection.collection('interviews').createIndex({ scheduledAt: 1 });
            await mongoose_1.default.connection.collection('interviews').createIndex({ candidateId: 1, status: 1 });
            await mongoose_1.default.connection.collection('interviews').createIndex({ candidateId: 1, createdAt: -1 });
            // Payment indexes
            await mongoose_1.default.connection.collection('payments').createIndex({ userId: 1 });
            await mongoose_1.default.connection.collection('payments').createIndex({ status: 1 });
            await mongoose_1.default.connection.collection('payments').createIndex({ paymentIntentId: 1 }, { unique: true });
            await mongoose_1.default.connection.collection('payments').createIndex({ createdAt: -1 });
            // Report indexes
            await mongoose_1.default.connection.collection('reports').createIndex({ candidateId: 1 });
            await mongoose_1.default.connection.collection('reports').createIndex({ interviewId: 1 });
            await mongoose_1.default.connection.collection('reports').createIndex({ type: 1 });
            await mongoose_1.default.connection.collection('reports').createIndex({ candidateId: 1, createdAt: -1 });
            // Question bank indexes
            await mongoose_1.default.connection.collection('questionbanks').createIndex({ category: 1, difficulty: 1, type: 1 });
            await mongoose_1.default.connection.collection('questionbanks').createIndex({ isActive: 1 });
            await mongoose_1.default.connection.collection('questionbanks').createIndex({ tags: 1 });
            await mongoose_1.default.connection.collection('questionbanks').createIndex({
                title: 'text',
                question: 'text',
                description: 'text',
                tags: 'text'
            });
            logger_1.default.info('Database indexes created successfully');
        }
        catch (error) {
            logger_1.default.error('Error creating database indexes:', error);
            throw error;
        }
    }
    async seedInitialData() {
        try {
            logger_1.default.info('Seeding initial data...');
            const { User, QuestionBank } = await Promise.resolve().then(() => __importStar(require('@/models')));
            // Create admin user if not exists
            const adminExists = await User.findOne({ role: 'admin' });
            if (!adminExists) {
                const adminUser = new User({
                    email: process.env.ADMIN_EMAIL || 'admin@aiinterviewbot.com',
                    password: process.env.ADMIN_DEFAULT_PASSWORD || 'Admin123!',
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'admin',
                    isEmailVerified: true,
                    subscription: {
                        plan: 'enterprise',
                        status: 'active',
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
                    }
                });
                await adminUser.save();
                logger_1.default.info('Admin user created');
            }
            // Create sample questions if none exist
            const questionCount = await QuestionBank.countDocuments();
            if (questionCount === 0) {
                const sampleQuestions = [
                    {
                        title: 'Tell me about yourself',
                        category: 'Behavioral',
                        difficulty: 'easy',
                        type: 'open_ended',
                        question: 'Can you tell me about yourself and your background?',
                        expectedAnswer: 'Should include professional background, key skills, and career goals',
                        tags: ['introduction', 'background', 'general'],
                        isActive: true,
                        createdBy: (await User.findOne({ role: 'admin' }))?._id || 'system'
                    },
                    {
                        title: 'Why do you want this job?',
                        category: 'Behavioral',
                        difficulty: 'easy',
                        type: 'open_ended',
                        question: 'Why are you interested in this position and our company?',
                        expectedAnswer: 'Should show research about company and alignment with career goals',
                        tags: ['motivation', 'company-fit', 'interest'],
                        isActive: true,
                        createdBy: (await User.findOne({ role: 'admin' }))?._id || 'system'
                    },
                    {
                        title: 'Greatest strength',
                        category: 'Behavioral',
                        difficulty: 'medium',
                        type: 'open_ended',
                        question: 'What do you consider to be your greatest professional strength?',
                        expectedAnswer: 'Should provide specific strength with examples and relevance to role',
                        tags: ['strengths', 'self-assessment', 'skills'],
                        isActive: true,
                        createdBy: (await User.findOne({ role: 'admin' }))?._id || 'system'
                    },
                    {
                        title: 'Handle challenging situation',
                        category: 'Behavioral',
                        difficulty: 'medium',
                        type: 'open_ended',
                        question: 'Describe a challenging situation at work and how you handled it.',
                        expectedAnswer: 'Should use STAR method (Situation, Task, Action, Result)',
                        tags: ['problem-solving', 'challenges', 'experience'],
                        isActive: true,
                        createdBy: (await User.findOne({ role: 'admin' }))?._id || 'system'
                    },
                    {
                        title: 'Career goals',
                        category: 'Behavioral',
                        difficulty: 'easy',
                        type: 'open_ended',
                        question: 'Where do you see yourself in 5 years?',
                        expectedAnswer: 'Should show ambition, planning, and alignment with career path',
                        tags: ['goals', 'future', 'planning'],
                        isActive: true,
                        createdBy: (await User.findOne({ role: 'admin' }))?._id || 'system'
                    }
                ];
                await QuestionBank.insertMany(sampleQuestions);
                logger_1.default.info('Sample questions created');
            }
            logger_1.default.info('Initial data seeding completed');
        }
        catch (error) {
            logger_1.default.error('Error seeding initial data:', error);
            throw error;
        }
    }
}
exports.default = Database.getInstance();
//# sourceMappingURL=database.js.map