import mongoose, { Schema } from 'mongoose';
import { IQuestionBank } from '@/types';

const questionBankSchema = new Schema<IQuestionBank>({
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Difficulty level is required']
  },
  type: {
    type: String,
    enum: ['multiple_choice', 'coding', 'open_ended', 'behavioral'],
    required: [true, 'Question type is required']
  },
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  options: [{
    type: String,
    trim: true
  }],
  correctAnswer: {
    type: String,
    trim: true
  },
  explanation: {
    type: String,
    trim: true,
    maxlength: [1000, 'Explanation cannot exceed 1000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  usage: {
    type: Number,
    default: 0,
    min: [0, 'Usage count cannot be negative']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: [true, 'Creator ID is required'],
    ref: 'User'
  },
  lastUsed: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
questionBankSchema.index({ category: 1 });
questionBankSchema.index({ difficulty: 1 });
questionBankSchema.index({ type: 1 });
questionBankSchema.index({ isActive: 1 });
questionBankSchema.index({ tags: 1 });
questionBankSchema.index({ usage: -1 });
questionBankSchema.index({ rating: -1 });
questionBankSchema.index({ createdBy: 1 });

// Compound indexes
questionBankSchema.index({ category: 1, difficulty: 1, type: 1 });
questionBankSchema.index({ isActive: 1, category: 1 });
questionBankSchema.index({ isActive: 1, difficulty: 1 });

// Text index for search
questionBankSchema.index({
  title: 'text',
  question: 'text',
  description: 'text',
  tags: 'text'
});

// Virtual for average rating display
questionBankSchema.virtual('displayRating').get(function() {
  return this.rating.toFixed(1);
});

// Method to increment usage
questionBankSchema.methods.incrementUsage = function() {
  this.usage += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Method to update rating
questionBankSchema.methods.updateRating = function(newRating: number) {
  // Simple rating update - in production, you might want to track individual ratings
  this.rating = Math.round(((this.rating + newRating) / 2) * 10) / 10;
  return this.save();
};

// Method to add tag
questionBankSchema.methods.addTag = function(tag: string) {
  const normalizedTag = tag.toLowerCase().trim();
  if (!this.tags.includes(normalizedTag)) {
    this.tags.push(normalizedTag);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove tag
questionBankSchema.methods.removeTag = function(tag: string) {
  const normalizedTag = tag.toLowerCase().trim();
  this.tags = this.tags.filter(t => t !== normalizedTag);
  return this.save();
};

// Static method to get popular questions
questionBankSchema.statics.getPopularQuestions = function(limit: number = 10) {
  return this.find({ isActive: true })
    .sort({ usage: -1, rating: -1 })
    .limit(limit);
};

// Static method to get questions by category and difficulty
questionBankSchema.statics.getQuestionsByFilter = function(filters: {
  category?: string;
  difficulty?: string;
  type?: string;
  tags?: string[];
  limit?: number;
}) {
  const query: any = { isActive: true };
  
  if (filters.category) query.category = filters.category;
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.type) query.type = filters.type;
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  
  return this.find(query)
    .sort({ rating: -1, usage: -1 })
    .limit(filters.limit || 50);
};

// Static method to search questions
questionBankSchema.statics.searchQuestions = function(searchTerm: string, filters?: any) {
  const query: any = {
    isActive: true,
    $text: { $search: searchTerm }
  };
  
  if (filters) {
    Object.assign(query, filters);
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, rating: -1 });
};

// Static method to get random questions for interview
questionBankSchema.statics.getRandomQuestions = function(criteria: {
  category?: string;
  difficulty?: string;
  type?: string;
  count: number;
}) {
  const pipeline = [
    {
      $match: {
        isActive: true,
        ...(criteria.category && { category: criteria.category }),
        ...(criteria.difficulty && { difficulty: criteria.difficulty }),
        ...(criteria.type && { type: criteria.type })
      }
    },
    { $sample: { size: criteria.count } }
  ];
  
  return this.aggregate(pipeline);
};

// Pre-save middleware to normalize tags
questionBankSchema.pre('save', function(next) {
  if (this.isModified('tags')) {
    this.tags = this.tags.map(tag => tag.toLowerCase().trim()).filter(Boolean);
    // Remove duplicates
    this.tags = [...new Set(this.tags)];
  }
  next();
});

// Ensure virtual fields are serialized
questionBankSchema.set('toJSON', { virtuals: true });

export const QuestionBank = mongoose.model<IQuestionBank>('QuestionBank', questionBankSchema);