import { Document } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'candidate' | 'admin' | 'recruiter';
  avatar?: string;
  phone?: string;
  dateOfBirth?: Date;
  location?: string;
  skills?: string[];
  experience?: number;
  education?: string;
  resume?: string;
  linkedinProfile?: string;
  githubProfile?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  subscription?: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    startDate: Date;
    endDate: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  preferences?: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Interview Types
export interface IInterview extends Document {
  _id: string;
  candidateId: string;
  recruiterId?: string;
  title: string;
  description?: string;
  position: string;
  company?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'technical' | 'behavioral' | 'mixed';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  duration: number; // in seconds
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  questions: IInterviewQuestion[];
  responses: IInterviewResponse[];
  overallScore?: number;
  feedback?: string;
  aiAnalysis?: {
    communication: number;
    technical: number;
    problemSolving: number;
    confidence: number;
    overall: number;
    strengths: string[];
    improvements: string[];
    detailedFeedback: string;
  };
  recordingUrl?: string;
  transcription?: string;
  reportGenerated: boolean;
  reportUrl?: string;
  settings: {
    enableVideo: boolean;
    enableAudio: boolean;
    enableScreenShare: boolean;
    timeLimit: number;
    questionsCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IInterviewQuestion {
  _id: string;
  question: string;
  type: 'multiple_choice' | 'coding' | 'open_ended' | 'behavioral';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  expectedAnswer?: string;
  options?: string[];
  timeLimit?: number;
  order: number;
}

export interface IInterviewResponse {
  questionId: string;
  answer: string;
  audioUrl?: string;
  videoUrl?: string;
  transcription?: string;
  timeTaken: number;
  score?: number;
  aiEvaluation?: {
    accuracy: number;
    clarity: number;
    relevance: number;
    feedback: string;
  };
  submittedAt: Date;
}

// Payment Types
export interface IPayment extends Document {
  _id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'razorpay' | 'paypal';
  paymentIntentId: string;
  subscriptionId?: string;
  plan: 'basic' | 'premium' | 'enterprise';
  billingPeriod: 'monthly' | 'yearly';
  description: string;
  metadata?: Record<string, any>;
  refundReason?: string;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Report Types
export interface IReport extends Document {
  _id: string;
  interviewId: string;
  candidateId: string;
  recruiterId?: string;
  type: 'interview' | 'performance' | 'analytics';
  title: string;
  data: {
    summary: {
      totalQuestions: number;
      correctAnswers: number;
      averageScore: number;
      totalTime: number;
    };
    sections: IReportSection[];
    recommendations: string[];
    nextSteps: string[];
  };
  fileUrl?: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReportSection {
  title: string;
  content: string;
  score?: number;
  charts?: any[];
  tables?: any[];
}

// Question Bank Types
export interface IQuestionBank extends Document {
  _id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'multiple_choice' | 'coding' | 'open_ended' | 'behavioral';
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  tags: string[];
  usage: number;
  rating: number;
  isActive: boolean;
  createdBy: string;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export interface INotification extends Document {
  _id: string;
  userId: string;
  type: 'interview_scheduled' | 'interview_completed' | 'report_ready' | 'payment_success' | 'subscription_expiry';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  sentAt?: Date;
  channels: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Types
export interface IAnalytics extends Document {
  _id: string;
  userId?: string;
  event: string;
  data: Record<string, any>;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Request Types
export interface AuthenticatedRequest extends Request {
  user?: IUser;
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}

// Socket Types
export interface SocketData {
  userId: string;
  interviewId?: string;
  role: string;
}

// AI Service Types
export interface GeminiResponse {
  text: string;
  candidates?: any[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface TTSRequest {
  text: string;
  language?: string;
  voice?: string;
  speed?: number;
}

export interface STTRequest {
  audioBuffer: Buffer;
  encoding?: string;
  sampleRateHertz?: number;
  languageCode?: string;
}

// Email Template Types
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: any[];
  template?: string;
  data?: Record<string, any>;
}

// File Upload Types
export interface FileUploadResult {
  url: string;
  publicId: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
}

// Error Types
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Subscription Plans
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limits: {
    interviews: number;
    reports: number;
    storage: number; // in GB
  };
  popular?: boolean;
}