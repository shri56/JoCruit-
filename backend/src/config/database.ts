import mongoose from 'mongoose';
import logger from '@/utils/logger';

class Database {
  private static instance: Database;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected');
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
      await mongoose.connect(mongoUri, options);

      this.isConnected = true;
      logger.info('Successfully connected to MongoDB', {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        database: mongoose.connection.name
      });

      // Connection event handlers
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('Disconnected from MongoDB');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public async ping(): Promise<boolean> {
    try {
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      logger.error('Database ping failed:', error);
      return false;
    }
  }

  public getStats(): any {
    if (!this.isConnected) {
      return null;
    }

    return {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      collections: Object.keys(mongoose.connection.collections)
    };
  }

  public async createIndexes(): Promise<void> {
    try {
      logger.info('Creating database indexes...');

      // User indexes
      await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
      await mongoose.connection.collection('users').createIndex({ role: 1 });
      await mongoose.connection.collection('users').createIndex({ 'subscription.plan': 1 });
      await mongoose.connection.collection('users').createIndex({ createdAt: -1 });

      // Interview indexes
      await mongoose.connection.collection('interviews').createIndex({ candidateId: 1 });
      await mongoose.connection.collection('interviews').createIndex({ status: 1 });
      await mongoose.connection.collection('interviews').createIndex({ scheduledAt: 1 });
      await mongoose.connection.collection('interviews').createIndex({ candidateId: 1, status: 1 });
      await mongoose.connection.collection('interviews').createIndex({ candidateId: 1, createdAt: -1 });

      // Payment indexes
      await mongoose.connection.collection('payments').createIndex({ userId: 1 });
      await mongoose.connection.collection('payments').createIndex({ status: 1 });
      await mongoose.connection.collection('payments').createIndex({ paymentIntentId: 1 }, { unique: true });
      await mongoose.connection.collection('payments').createIndex({ createdAt: -1 });

      // Report indexes
      await mongoose.connection.collection('reports').createIndex({ candidateId: 1 });
      await mongoose.connection.collection('reports').createIndex({ interviewId: 1 });
      await mongoose.connection.collection('reports').createIndex({ type: 1 });
      await mongoose.connection.collection('reports').createIndex({ candidateId: 1, createdAt: -1 });

      // Question bank indexes
      await mongoose.connection.collection('questionbanks').createIndex({ category: 1, difficulty: 1, type: 1 });
      await mongoose.connection.collection('questionbanks').createIndex({ isActive: 1 });
      await mongoose.connection.collection('questionbanks').createIndex({ tags: 1 });
      await mongoose.connection.collection('questionbanks').createIndex({ 
        title: 'text', 
        question: 'text', 
        description: 'text', 
        tags: 'text' 
      });

      logger.info('Database indexes created successfully');

    } catch (error) {
      logger.error('Error creating database indexes:', error);
      throw error;
    }
  }

  public async seedInitialData(): Promise<void> {
    try {
      logger.info('Seeding initial data...');

      const { User, QuestionBank } = await import('@/models');

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
        logger.info('Admin user created');
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
        logger.info('Sample questions created');
      }

      logger.info('Initial data seeding completed');

    } catch (error) {
      logger.error('Error seeding initial data:', error);
      throw error;
    }
  }
}

export default Database.getInstance();