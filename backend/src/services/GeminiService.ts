import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiResponse, IInterviewQuestion, IInterviewResponse } from '@/types';
import logger from '@/utils/logger';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-pro' 
    });
  }

  /**
   * Generate interview questions based on position and requirements
   */
  async generateInterviewQuestions(params: {
    position: string;
    company?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    type: 'technical' | 'behavioral' | 'mixed';
    count: number;
    skills?: string[];
  }): Promise<IInterviewQuestion[]> {
    try {
      const prompt = this.buildQuestionGenerationPrompt(params);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const questions = this.parseQuestionsFromResponse(text, params.type);
      
      logger.info('Generated interview questions', {
        position: params.position,
        count: questions.length,
        difficulty: params.difficulty
      });

      return questions;
    } catch (error) {
      logger.error('Error generating interview questions:', error);
      throw new Error('Failed to generate interview questions');
    }
  }

  /**
   * Evaluate candidate's response to a question
   */
  async evaluateResponse(params: {
    question: IInterviewQuestion;
    response: string;
    transcription?: string;
    position: string;
  }): Promise<{
    score: number;
    accuracy: number;
    clarity: number;
    relevance: number;
    feedback: string;
  }> {
    try {
      const prompt = this.buildEvaluationPrompt(params);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const evaluation = this.parseEvaluationFromResponse(text);
      
      logger.info('Evaluated candidate response', {
        questionId: params.question._id,
        score: evaluation.score
      });

      return evaluation;
    } catch (error) {
      logger.error('Error evaluating response:', error);
      throw new Error('Failed to evaluate response');
    }
  }

  /**
   * Generate comprehensive interview analysis
   */
  async generateInterviewAnalysis(params: {
    position: string;
    candidate: {
      name: string;
      experience?: number;
      skills?: string[];
    };
    responses: IInterviewResponse[];
    questions: IInterviewQuestion[];
  }): Promise<{
    communication: number;
    technical: number;
    problemSolving: number;
    confidence: number;
    overall: number;
    strengths: string[];
    improvements: string[];
    detailedFeedback: string;
  }> {
    try {
      const prompt = this.buildAnalysisPrompt(params);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const analysis = this.parseAnalysisFromResponse(text);
      
      logger.info('Generated interview analysis', {
        position: params.position,
        candidateName: params.candidate.name,
        overallScore: analysis.overall
      });

      return analysis;
    } catch (error) {
      logger.error('Error generating interview analysis:', error);
      throw new Error('Failed to generate interview analysis');
    }
  }

  /**
   * Generate follow-up questions based on candidate responses
   */
  async generateFollowUpQuestions(params: {
    originalQuestion: IInterviewQuestion;
    candidateResponse: string;
    position: string;
    count?: number;
  }): Promise<IInterviewQuestion[]> {
    try {
      const prompt = this.buildFollowUpPrompt(params);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const questions = this.parseQuestionsFromResponse(text, 'open_ended');
      
      logger.info('Generated follow-up questions', {
        originalQuestionId: params.originalQuestion._id,
        count: questions.length
      });

      return questions;
    } catch (error) {
      logger.error('Error generating follow-up questions:', error);
      throw new Error('Failed to generate follow-up questions');
    }
  }

  /**
   * Generate personalized feedback and recommendations
   */
  async generatePersonalizedFeedback(params: {
    candidateName: string;
    position: string;
    overallScore: number;
    responses: IInterviewResponse[];
    strengths: string[];
    improvements: string[];
  }): Promise<{
    motivationalMessage: string;
    specificRecommendations: string[];
    learningPath: string[];
    nextSteps: string[];
  }> {
    try {
      const prompt = this.buildFeedbackPrompt(params);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const feedback = this.parseFeedbackFromResponse(text);
      
      logger.info('Generated personalized feedback', {
        candidateName: params.candidateName,
        position: params.position
      });

      return feedback;
    } catch (error) {
      logger.error('Error generating personalized feedback:', error);
      throw new Error('Failed to generate personalized feedback');
    }
  }

  /**
   * Build prompt for question generation
   */
  private buildQuestionGenerationPrompt(params: {
    position: string;
    company?: string;
    difficulty: string;
    type: string;
    count: number;
    skills?: string[];
  }): string {
    return `
Generate ${params.count} ${params.difficulty} ${params.type} interview questions for a ${params.position} position${params.company ? ` at ${params.company}` : ''}.

${params.skills ? `Required skills: ${params.skills.join(', ')}` : ''}

For each question, provide:
1. Question text
2. Type (multiple_choice, coding, open_ended, or behavioral)
3. Difficulty level
4. Category
5. Expected answer or key points
6. Time limit in seconds (if applicable)

Format the response as JSON array with the following structure:
[
  {
    "question": "Question text here",
    "type": "question_type",
    "difficulty": "${params.difficulty}",
    "category": "category_name",
    "expectedAnswer": "Expected answer or key points",
    "timeLimit": 300,
    "order": 1
  }
]

Focus on:
- ${params.type === 'technical' ? 'Technical skills, problem-solving, and domain expertise' : ''}
- ${params.type === 'behavioral' ? 'Soft skills, past experiences, and cultural fit' : ''}
- ${params.type === 'mixed' ? 'Both technical competence and behavioral aspects' : ''}
- Real-world scenarios relevant to the position
- Progressive difficulty if multiple questions
`;
  }

  /**
   * Build prompt for response evaluation
   */
  private buildEvaluationPrompt(params: {
    question: IInterviewQuestion;
    response: string;
    transcription?: string;
    position: string;
  }): string {
    return `
Evaluate this interview response for a ${params.position} position:

Question: ${params.question.question}
Expected Answer: ${params.question.expectedAnswer || 'Open-ended question'}
Candidate Response: ${params.response}
${params.transcription ? `Transcription (for clarity assessment): ${params.transcription}` : ''}

Provide evaluation scores (0-100) for:
1. Accuracy - How correct/relevant is the answer
2. Clarity - How well communicated is the response
3. Relevance - How well does it address the question
4. Overall Score - Weighted average

Also provide detailed feedback explaining:
- What was good about the response
- Areas for improvement
- Specific recommendations

Format as JSON:
{
  "score": 85,
  "accuracy": 90,
  "clarity": 80,
  "relevance": 85,
  "feedback": "Detailed feedback here..."
}
`;
  }

  /**
   * Build prompt for interview analysis
   */
  private buildAnalysisPrompt(params: {
    position: string;
    candidate: any;
    responses: IInterviewResponse[];
    questions: IInterviewQuestion[];
  }): string {
    const responseSummary = params.responses.map((r, i) => 
      `Q${i + 1}: ${params.questions[i]?.question}\nA: ${r.answer}\nScore: ${r.score || 'N/A'}`
    ).join('\n\n');

    return `
Provide comprehensive analysis for ${params.candidate.name}'s interview for ${params.position} position.

Candidate Background:
- Experience: ${params.candidate.experience || 'Not specified'} years
- Skills: ${params.candidate.skills?.join(', ') || 'Not specified'}

Interview Performance:
${responseSummary}

Analyze and provide scores (0-100) for:
1. Communication - Clarity, articulation, confidence in responses
2. Technical - Technical knowledge and problem-solving skills
3. Problem Solving - Analytical thinking and approach to challenges
4. Confidence - Self-assurance and composure during interview
5. Overall - Weighted assessment considering all factors

Also identify:
- Top 3-5 strengths demonstrated
- Top 3-5 areas for improvement
- Detailed feedback for development

Format as JSON:
{
  "communication": 85,
  "technical": 78,
  "problemSolving": 82,
  "confidence": 75,
  "overall": 80,
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["improvement1", "improvement2", ...],
  "detailedFeedback": "Comprehensive feedback here..."
}
`;
  }

  /**
   * Build prompt for follow-up questions
   */
  private buildFollowUpPrompt(params: {
    originalQuestion: IInterviewQuestion;
    candidateResponse: string;
    position: string;
    count?: number;
  }): string {
    return `
Generate ${params.count || 2} follow-up questions based on this interview exchange for a ${params.position} position:

Original Question: ${params.originalQuestion.question}
Candidate Response: ${params.candidateResponse}

Create follow-up questions that:
- Dive deeper into the candidate's response
- Explore edge cases or alternative approaches
- Assess deeper understanding of the topic
- Remain relevant to the ${params.position} role

Format as JSON array similar to the original question format.
`;
  }

  /**
   * Build prompt for personalized feedback
   */
  private buildFeedbackPrompt(params: {
    candidateName: string;
    position: string;
    overallScore: number;
    responses: IInterviewResponse[];
    strengths: string[];
    improvements: string[];
  }): string {
    return `
Generate personalized, encouraging feedback for ${params.candidateName} who interviewed for ${params.position} position.

Overall Score: ${params.overallScore}/100
Strengths: ${params.strengths.join(', ')}
Areas for Improvement: ${params.improvements.join(', ')}

Provide:
1. Motivational message acknowledging their efforts and potential
2. Specific recommendations for skill development
3. Learning path with actionable steps
4. Next steps for career advancement

Format as JSON:
{
  "motivationalMessage": "Encouraging message here...",
  "specificRecommendations": ["rec1", "rec2", ...],
  "learningPath": ["step1", "step2", ...],
  "nextSteps": ["next1", "next2", ...]
}

Keep tone professional yet encouraging, focus on growth opportunities.
`;
  }

  /**
   * Parse questions from AI response
   */
  private parseQuestionsFromResponse(text: string, defaultType: string): IInterviewQuestion[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        return questions.map((q: any, index: number) => ({
          _id: `generated_${Date.now()}_${index}`,
          question: q.question,
          type: q.type || defaultType,
          difficulty: q.difficulty,
          category: q.category || 'General',
          expectedAnswer: q.expectedAnswer,
          options: q.options,
          timeLimit: q.timeLimit,
          order: q.order || index + 1
        }));
      }
    } catch (error) {
      logger.error('Error parsing questions from AI response:', error);
    }

    // Fallback: parse line by line if JSON parsing fails
    return this.fallbackQuestionParsing(text, defaultType);
  }

  /**
   * Parse evaluation from AI response
   */
  private parseEvaluationFromResponse(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.error('Error parsing evaluation from AI response:', error);
    }

    // Fallback with default values
    return {
      score: 70,
      accuracy: 70,
      clarity: 70,
      relevance: 70,
      feedback: 'Unable to generate detailed feedback. Please review manually.'
    };
  }

  /**
   * Parse analysis from AI response
   */
  private parseAnalysisFromResponse(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.error('Error parsing analysis from AI response:', error);
    }

    // Fallback with default values
    return {
      communication: 70,
      technical: 70,
      problemSolving: 70,
      confidence: 70,
      overall: 70,
      strengths: ['Shows potential', 'Demonstrates effort'],
      improvements: ['Continue practicing', 'Enhance technical skills'],
      detailedFeedback: 'Analysis could not be generated. Please review manually.'
    };
  }

  /**
   * Parse feedback from AI response
   */
  private parseFeedbackFromResponse(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.error('Error parsing feedback from AI response:', error);
    }

    // Fallback with default values
    return {
      motivationalMessage: 'Thank you for participating in the interview. Keep practicing and improving!',
      specificRecommendations: ['Practice more technical questions', 'Improve communication skills'],
      learningPath: ['Study relevant technologies', 'Practice interview questions'],
      nextSteps: ['Continue job searching', 'Build more projects']
    };
  }

  /**
   * Fallback question parsing when JSON parsing fails
   */
  private fallbackQuestionParsing(text: string, defaultType: string): IInterviewQuestion[] {
    const lines = text.split('\n').filter(line => line.trim());
    const questions: IInterviewQuestion[] = [];
    
    lines.forEach((line, index) => {
      if (line.includes('?') || line.toLowerCase().includes('question')) {
        questions.push({
          _id: `fallback_${Date.now()}_${index}`,
          question: line.trim(),
          type: defaultType as any,
          difficulty: 'medium' as any,
          category: 'General',
          order: index + 1
        });
      }
    });

    return questions.slice(0, 10); // Limit to 10 questions
  }
}

export default new GeminiService();