import mongoose, { Schema } from 'mongoose';
import { IReport, IReportSection } from '@/types';

const reportSectionSchema = new Schema<IReportSection>({
  title: {
    type: String,
    required: [true, 'Section title is required'],
    trim: true,
    maxlength: [200, 'Section title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Section content is required'],
    trim: true
  },
  score: {
    type: Number,
    min: [0, 'Score cannot be negative'],
    max: [100, 'Score cannot exceed 100']
  },
  charts: [{
    type: Schema.Types.Mixed
  }],
  tables: [{
    type: Schema.Types.Mixed
  }]
}, { _id: true });

const reportDataSchema = new Schema({
  summary: {
    totalQuestions: {
      type: Number,
      required: [true, 'Total questions is required'],
      min: [0, 'Total questions cannot be negative']
    },
    correctAnswers: {
      type: Number,
      required: [true, 'Correct answers is required'],
      min: [0, 'Correct answers cannot be negative']
    },
    averageScore: {
      type: Number,
      required: [true, 'Average score is required'],
      min: [0, 'Average score cannot be negative'],
      max: [100, 'Average score cannot exceed 100']
    },
    totalTime: {
      type: Number,
      required: [true, 'Total time is required'],
      min: [0, 'Total time cannot be negative']
    }
  },
  sections: [reportSectionSchema],
  recommendations: [{
    type: String,
    trim: true,
    maxlength: [500, 'Recommendation cannot exceed 500 characters']
  }],
  nextSteps: [{
    type: String,
    trim: true,
    maxlength: [500, 'Next step cannot exceed 500 characters']
  }]
}, { _id: false });

const reportSchema = new Schema<IReport>({
  interviewId: {
    type: String,
    required: [true, 'Interview ID is required'],
    ref: 'Interview'
  },
  candidateId: {
    type: String,
    required: [true, 'Candidate ID is required'],
    ref: 'User'
  },
  recruiterId: {
    type: String,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['interview', 'performance', 'analytics'],
    required: [true, 'Report type is required']
  },
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  data: {
    type: reportDataSchema,
    required: [true, 'Report data is required']
  },
  fileUrl: {
    type: String
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
reportSchema.index({ interviewId: 1 });
reportSchema.index({ candidateId: 1 });
reportSchema.index({ recruiterId: 1 });
reportSchema.index({ type: 1 });
reportSchema.index({ generatedAt: -1 });
reportSchema.index({ createdAt: -1 });

// Compound indexes
reportSchema.index({ candidateId: 1, type: 1 });
reportSchema.index({ candidateId: 1, createdAt: -1 });
reportSchema.index({ interviewId: 1, type: 1 });

// Virtual for performance grade
reportSchema.virtual('performanceGrade').get(function() {
  const score = this.data?.summary?.averageScore || 0;
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
});

// Virtual for formatted total time
reportSchema.virtual('formattedTotalTime').get(function() {
  const totalSeconds = this.data?.summary?.totalTime || 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
});

// Virtual for accuracy percentage
reportSchema.virtual('accuracyPercentage').get(function() {
  const summary = this.data?.summary;
  if (!summary || summary.totalQuestions === 0) return 0;
  return Math.round((summary.correctAnswers / summary.totalQuestions) * 100);
});

// Method to add section to report
reportSchema.methods.addSection = function(section: IReportSection) {
  this.data.sections.push(section);
  return this.save();
};

// Method to add recommendation
reportSchema.methods.addRecommendation = function(recommendation: string) {
  this.data.recommendations.push(recommendation);
  return this.save();
};

// Method to add next step
reportSchema.methods.addNextStep = function(nextStep: string) {
  this.data.nextSteps.push(nextStep);
  return this.save();
};

// Method to get sections by type
reportSchema.methods.getSectionsByType = function(title: string) {
  return this.data.sections.filter(section => 
    section.title.toLowerCase().includes(title.toLowerCase())
  );
};

// Method to calculate overall performance
reportSchema.methods.calculateOverallPerformance = function() {
  const sections = this.data.sections || [];
  const scoredSections = sections.filter(section => section.score !== undefined);
  
  if (scoredSections.length === 0) {
    return this.data?.summary?.averageScore || 0;
  }
  
  const totalScore = scoredSections.reduce((sum, section) => sum + (section.score || 0), 0);
  return Math.round(totalScore / scoredSections.length);
};

// Static method to generate summary statistics
reportSchema.statics.generateSummaryStats = async function(candidateId: string) {
  const reports = await this.find({ candidateId }).sort({ createdAt: -1 });
  
  if (reports.length === 0) {
    return {
      totalReports: 0,
      averageScore: 0,
      improvement: 0,
      lastReportDate: null
    };
  }
  
  const totalScore = reports.reduce((sum, report) => 
    sum + (report.data?.summary?.averageScore || 0), 0
  );
  const averageScore = Math.round(totalScore / reports.length);
  
  // Calculate improvement (comparing last 2 reports)
  let improvement = 0;
  if (reports.length >= 2) {
    const latest = reports[0].data?.summary?.averageScore || 0;
    const previous = reports[1].data?.summary?.averageScore || 0;
    improvement = latest - previous;
  }
  
  return {
    totalReports: reports.length,
    averageScore,
    improvement,
    lastReportDate: reports[0].createdAt
  };
};

// Pre-save middleware to ensure data integrity
reportSchema.pre('save', function(next) {
  // Ensure summary accuracy
  if (this.data && this.data.summary) {
    const { totalQuestions, correctAnswers } = this.data.summary;
    if (correctAnswers > totalQuestions) {
      this.data.summary.correctAnswers = totalQuestions;
    }
  }
  next();
});

// Ensure virtual fields are serialized
reportSchema.set('toJSON', { virtuals: true });

export const Report = mongoose.model<IReport>('Report', reportSchema);