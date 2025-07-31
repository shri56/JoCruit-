import { IInterviewQuestion, IInterviewResponse } from '@/types';
declare class GeminiService {
    private genAI;
    private model;
    constructor();
    /**
     * Generate interview questions based on position and requirements
     */
    generateInterviewQuestions(params: {
        position: string;
        company?: string;
        difficulty: 'easy' | 'medium' | 'hard';
        type: 'technical' | 'behavioral' | 'mixed';
        count: number;
        skills?: string[];
    }): Promise<IInterviewQuestion[]>;
    /**
     * Evaluate candidate's response to a question
     */
    evaluateResponse(params: {
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
    }>;
    /**
     * Generate comprehensive interview analysis
     */
    generateInterviewAnalysis(params: {
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
    }>;
    /**
     * Generate follow-up questions based on candidate responses
     */
    generateFollowUpQuestions(params: {
        originalQuestion: IInterviewQuestion;
        candidateResponse: string;
        position: string;
        count?: number;
    }): Promise<IInterviewQuestion[]>;
    /**
     * Generate personalized feedback and recommendations
     */
    generatePersonalizedFeedback(params: {
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
    }>;
    /**
     * Build prompt for question generation
     */
    private buildQuestionGenerationPrompt;
    /**
     * Build prompt for response evaluation
     */
    private buildEvaluationPrompt;
    /**
     * Build prompt for interview analysis
     */
    private buildAnalysisPrompt;
    /**
     * Build prompt for follow-up questions
     */
    private buildFollowUpPrompt;
    /**
     * Build prompt for personalized feedback
     */
    private buildFeedbackPrompt;
    /**
     * Parse questions from AI response
     */
    private parseQuestionsFromResponse;
    /**
     * Parse evaluation from AI response
     */
    private parseEvaluationFromResponse;
    /**
     * Parse analysis from AI response
     */
    private parseAnalysisFromResponse;
    /**
     * Parse feedback from AI response
     */
    private parseFeedbackFromResponse;
    /**
     * Fallback question parsing when JSON parsing fails
     */
    private fallbackQuestionParsing;
}
declare const _default: GeminiService;
export default _default;
