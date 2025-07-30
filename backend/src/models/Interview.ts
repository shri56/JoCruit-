import mongoose, { Schema } from 'mongoose';
import { IInterview, IInterviewQuestion, IInterviewResponse } from '@/types';

const questionSchema = new Schema<IInterviewQuestion>({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['multiple_choice', 'coding', 'open_ended', 'behavioral'],
    required: [true, 'Question type is required']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Question difficulty is required']
  },
  category: {
    type: String,
    required: [true, 'Question category is required'],
    trim: true
  },
  expectedAnswer: {
    type: String,
    trim: true
  },
  options: [{
    type: String,
    trim: true
  }],
  timeLimit: {
    type: Number,
    min: [30, 'Time limit must be at least 30 seconds'],
    max: [3600, 'Time limit cannot exceed 1 hour']
  },
  order: {
    type: Number,
    required: [true, 'Question order is required'],
    min: [1, 'Order must be at least 1']
  }
}, { _id: true });

const responseSchema = new Schema<IInterviewResponse>({
  questionId: {
    type: String,
    required: [true, 'Question ID is required']
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true
  },
  audioUrl: {
    type: String
  },
  videoUrl: {
    type: String
  },
  transcription: {
    type: String,
    trim: true
  },
  timeTaken: {
    type: Number,
    required: [true, 'Time taken is required'],
    min: [0, 'Time taken cannot be negative']
  },
  score: {
    type: Number,
    min: [0, 'Score cannot be negative'],
    max: [100, 'Score cannot exceed 100']
  },
  aiEvaluation: {
    accuracy: {
      type: Number,
      min: [0, 'Accuracy score cannot be negative'],
      max: [100, 'Accuracy score cannot exceed 100']
    },
    clarity: {
      type: Number,
      min: [0, 'Clarity score cannot be negative'],
      max: [100, 'Clarity score cannot exceed 100']
    },
    relevance: {
      type: Number,
      min: [0, 'Relevance score cannot be negative'],
      max: [100, 'Relevance score cannot exceed 100']
    },
    feedback: {
      type: String,
      trim: true
    }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const settingsSchema = new Schema({
  enableVideo: {
    type: Boolean,
    default: true
  },
  enableAudio: {
    type: Boolean,
    default: true
  },
  enableScreenShare: {
    type: Boolean,
    default: false
  },
  timeLimit: {
    type: Number,
    default: 3600, // 1 hour in seconds
    min: [300, 'Time limit must be at least 5 minutes'],
    max: [7200, 'Time limit cannot exceed 2 hours']
  },
  questionsCount: {
    type: Number,
    default: 10,
    min: [1, 'Must have at least 1 question'],
    max: [50, 'Cannot exceed 50 questions']
  }
}, { _id: false });

const aiAnalysisSchema = new Schema({
  communication: {
    type: Number,
    min: [0, 'Communication score cannot be negative'],
    max: [100, 'Communication score cannot exceed 100']
  },
  technical: {
    type: Number,
    min: [0, 'Technical score cannot be negative'],
    max: [100, 'Technical score cannot exceed 100']
  },
  problemSolving: {
    type: Number,
    min: [0, 'Problem solving score cannot be negative'],
    max: [100, 'Problem solving score cannot exceed 100']
  },
  confidence: {
    type: Number,
    min: [0, 'Confidence score cannot be negative'],
    max: [100, 'Confidence score cannot exceed 100']
  },
  overall: {
    type: Number,
    min: [0, 'Overall score cannot be negative'],
    max: [100, 'Overall score cannot exceed 100']
  },
  strengths: [{
    type: String,
    trim: true
  }],
  improvements: [{
    type: String,
    trim: true
  }],
  detailedFeedback: {
    type: String,
    trim: true
  }
}, { _id: false });

const interviewSchema = new Schema<IInterview>({
  candidateId: {
    type: String,
    required: [true, 'Candidate ID is required'],
    ref: 'User'
  },
  recruiterId: {
    type: String,
    ref: 'User'
  },
  title: {
    type: String,
    required: [true, 'Interview title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Difficulty level is required']
  },
  type: {
    type: String,
    enum: ['technical', 'behavioral', 'mixed'],
    required: [true, 'Interview type is required']
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  duration: {
    type: Number,
    default: 0,
    min: [0, 'Duration cannot be negative']
  },
  scheduledAt: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  questions: [questionSchema],
  responses: [responseSchema],
  overallScore: {
    type: Number,
    min: [0, 'Overall score cannot be negative'],
    max: [100, 'Overall score cannot exceed 100']
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [2000, 'Feedback cannot exceed 2000 characters']
  },
  aiAnalysis: {
    type: aiAnalysisSchema
  },
  recordingUrl: {
    type: String
  },
  transcription: {
    type: String,
    trim: true
  },
  reportGenerated: {
    type: Boolean,
    default: false
  },
  reportUrl: {
    type: String
  },
  settings: {
    type: settingsSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

// Indexes
interviewSchema.index({ candidateId: 1 });
interviewSchema.index({ recruiterId: 1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ scheduledAt: 1 });
interviewSchema.index({ createdAt: -1 });
interviewSchema.index({ position: 1, difficulty: 1 });
interviewSchema.index({ type: 1, status: 1 });

// Compound indexes
interviewSchema.index({ candidateId: 1, status: 1 });
interviewSchema.index({ candidateId: 1, createdAt: -1 });

// Virtual for average response time
interviewSchema.virtual('averageResponseTime').get(function() {
  if (!this.responses || this.responses.length === 0) return 0;
  const totalTime = this.responses.reduce((sum, response) => sum + response.timeTaken, 0);
  return Math.round(totalTime / this.responses.length);
});

// Virtual for completion percentage
interviewSchema.virtual('completionPercentage').get(function() {
  if (!this.questions || this.questions.length === 0) return 0;
  const answeredQuestions = this.responses?.length || 0;
  return Math.round((answeredQuestions / this.questions.length) * 100);
});

// Method to calculate overall score
interviewSchema.methods.calculateOverallScore = function() {
  if (!this.responses || this.responses.length === 0) return 0;
  
  const scoredResponses = this.responses.filter((response: any) => response.score !== undefined);
  if (scoredResponses.length === 0) return 0;
  
  const totalScore = scoredResponses.reduce((sum: number, response: any) => sum + response.score, 0);
  return Math.round(totalScore / scoredResponses.length);
};

// Method to check if interview is expired
interviewSchema.methods.isExpired = function() {
  if (!this.scheduledAt) return false;
  const now = new Date();
  const scheduledTime = new Date(this.scheduledAt);
  const timeLimit = this.settings?.timeLimit || 3600; // Default 1 hour
  const expiryTime = new Date(scheduledTime.getTime() + timeLimit * 1000);
  return now > expiryTime;
};

// Method to get remaining time
interviewSchema.methods.getRemainingTime = function() {
  if (!this.startedAt) return this.settings?.timeLimit || 3600;
  
  const now = new Date();
  const startTime = new Date(this.startedAt);
  const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
  const timeLimit = this.settings?.timeLimit || 3600;
  
  return Math.max(0, timeLimit - elapsed);
};

// Pre-save middleware to update completion status
interviewSchema.pre('save', function(next) {
  if (this.isModified('responses')) {
    if (this.responses && this.questions && this.responses.length === this.questions.length) {
      if (this.status === 'in_progress') {
        this.status = 'completed';
        this.completedAt = new Date();
        this.overallScore = this.calculateOverallScore();
      }
    }
  }
  next();
});

// Ensure virtual fields are serialized
interviewSchema.set('toJSON', { virtuals: true });

export const Interview = mongoose.model<IInterview>('Interview', interviewSchema);