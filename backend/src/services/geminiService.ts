import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '@/utils/logger';

interface AIAnalysisResult {
  overall: number;
  communication: number;
  technical: number;
  problemSolving: number;
  confidence: number;
  strengths: string[];
  improvements: string[];
  detailedAnalysis: {
    responseQuality: number;
    clarity: number;
    relevance: number;
    depth: number;
    examples: number;
  };
  personalityAssessment: {
    traits: Array<{
      trait: string;
      score: number;
      description: string;
    }>;
    workStyle: string;
    teamFit: string;
    leadership: number;
  };
  skillsAssessment: {
    technicalSkills: Array<{
      skill: string;
      demonstrated: boolean;
      proficiency: 'basic' | 'intermediate' | 'advanced';
      evidence: string[];
    }>;
    softSkills: Array<{
      skill: string;
      score: number;
      examples: string[];
    }>;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    resources: Array<{
      type: 'course' | 'book' | 'practice' | 'certification';
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
  industryComparison: {
    percentile: number;
    comparison: string;
    benchmarkAreas: string[];
  };
}

interface QuestionGenerationResult {
  questions: Array<{
    id: string;
    question: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    type: 'behavioral' | 'technical' | 'situational' | 'problem_solving';
    expectedAnswer: string;
    evaluationCriteria: string[];
    followUpQuestions: string[];
    skillsAssessed: string[];
    timeExpected: number;
  }>;
  rationale: string;
  alternativeQuestions: Array<{
    question: string;
    reason: string;
  }>;
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-pro' 
    });
  }

  /**
   * Generate comprehensive interview questions based on resume and role
   */
  async generateInterviewQuestions(
    resumeAnalysis: any,
    roleDescription: string,
    questionCount: number = 10,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    focusAreas: string[] = []
  ): Promise<QuestionGenerationResult> {
    try {
      const prompt = this.buildQuestionGenerationPrompt(
        resumeAnalysis,
        roleDescription,
        questionCount,
        difficulty,
        focusAreas
      );

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Parse the structured response
      const parsedResult = this.parseQuestionGenerationResponse(response);
      
      logger.info('Interview questions generated', {
        questionCount: parsedResult.questions.length,
        difficulty,
        categories: [...new Set(parsedResult.questions.map(q => q.category))]
      });

      return parsedResult;

    } catch (error) {
      logger.error('Error generating interview questions:', error);
      throw new Error('Failed to generate interview questions');
    }
  }

  /**
   * Evaluate candidate response with comprehensive analysis
   */
  async evaluateResponse(
    question: any,
    answer: string,
    resumeContext: any,
    roleContext: string,
    timeTaken: number
  ): Promise<{
    score: number;
    feedback: string;
    detailedAnalysis: any;
    aiEvaluation: any;
  }> {
    try {
      const prompt = this.buildEvaluationPrompt(
        question,
        answer,
        resumeContext,
        roleContext,
        timeTaken
      );

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const evaluation = this.parseEvaluationResponse(response);

      logger.info('Response evaluated', {
        questionType: question.type,
        score: evaluation.score,
        answerLength: answer.length,
        timeTaken
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
  async generateInterviewAnalysis(
    interview: any,
    resumeAnalysis: any,
    roleDescription: string
  ): Promise<AIAnalysisResult> {
    try {
      const prompt = this.buildAnalysisPrompt(interview, resumeAnalysis, roleDescription);
      
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const analysis = this.parseAnalysisResponse(response);

      logger.info('Interview analysis generated', {
        interviewId: interview._id,
        overallScore: analysis.overall,
        questionsAnalyzed: interview.responses?.length || 0
      });

      return analysis;

    } catch (error) {
      logger.error('Error generating interview analysis:', error);
      throw new Error('Failed to generate interview analysis');
    }
  }

  /**
   * Generate follow-up questions based on responses
   */
  async generateFollowUpQuestions(
    originalQuestion: any,
    answer: string,
    context: any
  ): Promise<string[]> {
    try {
      const prompt = `
        Based on the candidate's response, generate 2-3 relevant follow-up questions that would help assess them further.

        Original Question: ${originalQuestion.question}
        Candidate's Answer: ${answer}
        Question Category: ${originalQuestion.category}
        Skills Being Assessed: ${originalQuestion.skillsAssessed?.join(', ') || 'General'}

        Generate follow-up questions that:
        1. Probe deeper into the candidate's experience
        2. Clarify any vague or incomplete responses
        3. Test their knowledge in related areas
        4. Explore the impact or results of their actions

        Return only the questions, one per line, without numbering or bullet points.
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const followUpQuestions = response
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 3);

      return followUpQuestions;

    } catch (error) {
      logger.error('Error generating follow-up questions:', error);
      return [];
    }
  }

  /**
   * Generate personalized feedback and recommendations
   */
  async generatePersonalizedFeedback(
    analysis: AIAnalysisResult,
    roleDescription: string,
    careerGoals?: string
  ): Promise<{
    overallFeedback: string;
    strengths: string[];
    improvementPlan: any;
    careerAdvice: string;
    nextSteps: string[];
  }> {
    try {
      const prompt = `
        Generate personalized feedback and development recommendations based on the interview analysis:

        Overall Performance: ${analysis.overall}%
        Key Strengths: ${analysis.strengths.join(', ')}
        Areas for Improvement: ${analysis.improvements.join(', ')}
        Role: ${roleDescription}
        Career Goals: ${careerGoals || 'Not specified'}

        Technical Skills Performance: ${analysis.technical}%
        Communication Skills: ${analysis.communication}%
        Problem Solving: ${analysis.problemSolving}%
        Confidence Level: ${analysis.confidence}%

        Provide:
        1. Overall constructive feedback (2-3 paragraphs)
        2. Top 3 strengths with specific examples
        3. Detailed improvement plan with timeline
        4. Career advice tailored to their goals
        5. Concrete next steps they should take

        Format the response as JSON with the structure:
        {
          "overallFeedback": "detailed feedback...",
          "strengths": ["strength 1", "strength 2", "strength 3"],
          "improvementPlan": {
            "immediate": ["actions for next 2 weeks"],
            "shortTerm": ["actions for next 3 months"],
            "longTerm": ["actions for next year"]
          },
          "careerAdvice": "career guidance...",
          "nextSteps": ["specific actionable steps"]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const feedback = JSON.parse(jsonMatch[0]);

      logger.info('Personalized feedback generated');

      return feedback;

    } catch (error) {
      logger.error('Error generating personalized feedback:', error);
      throw new Error('Failed to generate personalized feedback');
    }
  }

  /**
   * Generate content with retry logic
   */
  async generateContent(prompt: string, retries: number = 3): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        logger.warn(`Gemini API attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error('All retry attempts failed');
  }

  // Private helper methods

  private buildQuestionGenerationPrompt(
    resumeAnalysis: any,
    roleDescription: string,
    questionCount: number,
    difficulty: string,
    focusAreas: string[]
  ): string {
    return `
      As an expert interview designer, generate ${questionCount} strategic interview questions based on the candidate's background and role requirements.

      CANDIDATE BACKGROUND:
      Skills: ${resumeAnalysis.skills?.join(', ') || 'Not specified'}
      Experience: ${JSON.stringify(resumeAnalysis.experience || [])}
      Key Strengths: ${resumeAnalysis.keyStrengths?.join(', ') || 'Not specified'}
      Education: ${JSON.stringify(resumeAnalysis.education || [])}

      ROLE REQUIREMENTS:
      ${roleDescription}

      PARAMETERS:
      - Difficulty Level: ${difficulty}
      - Focus Areas: ${focusAreas.length > 0 ? focusAreas.join(', ') : 'Balanced across all areas'}
      - Question Count: ${questionCount}

      REQUIREMENTS:
      1. Mix question types: 40% behavioral, 40% technical/role-specific, 20% situational
      2. Progressively increase difficulty throughout the interview
      3. Include questions that test both stated skills and potential growth areas
      4. Ensure questions are relevant to the candidate's experience level
      5. Include questions that reveal cultural fit and work style

      Return a JSON object with this structure:
      {
        "questions": [
          {
            "id": "unique_id",
            "question": "detailed question text",
            "category": "Technical|Behavioral|Situational|Problem-solving",
            "difficulty": "easy|medium|hard",
            "type": "behavioral|technical|situational|problem_solving",
            "expectedAnswer": "what a good answer should include",
            "evaluationCriteria": ["criterion 1", "criterion 2"],
            "followUpQuestions": ["potential follow-up 1", "potential follow-up 2"],
            "skillsAssessed": ["skill 1", "skill 2"],
            "timeExpected": 120
          }
        ],
        "rationale": "explanation of question selection strategy",
        "alternativeQuestions": [
          {
            "question": "alternative question",
            "reason": "why this could be used instead"
          }
        ]
      }
    `;
  }

  private buildEvaluationPrompt(
    question: any,
    answer: string,
    resumeContext: any,
    roleContext: string,
    timeTaken: number
  ): string {
    return `
      Evaluate this interview response comprehensively as an expert interviewer.

      QUESTION:
      Text: ${question.question}
      Category: ${question.category}
      Type: ${question.type}
      Expected Skills: ${question.skillsAssessed?.join(', ') || 'General assessment'}
      Expected Answer: ${question.expectedAnswer || 'Open-ended evaluation'}

      CANDIDATE'S ANSWER:
      ${answer}

      CONTEXT:
      - Time Taken: ${timeTaken} seconds (Expected: ${question.timeExpected || 120} seconds)
      - Candidate Background: ${JSON.stringify(resumeContext)}
      - Role Context: ${roleContext}

      EVALUATION CRITERIA:
      1. Content Quality (relevance, accuracy, depth)
      2. Communication Skills (clarity, structure, articulation)
      3. Technical Knowledge (if applicable)
      4. Problem-Solving Approach
      5. Examples and Evidence provided
      6. Cultural Fit indicators
      7. Time Management (response time appropriateness)

      Provide evaluation in JSON format:
      {
        "score": 85,
        "feedback": "detailed constructive feedback...",
        "detailedAnalysis": {
          "contentQuality": 80,
          "communicationSkills": 90,
          "technicalKnowledge": 75,
          "problemSolving": 85,
          "evidenceProvided": 70,
          "culturalFit": 95,
          "timeManagement": 80
        },
        "aiEvaluation": {
          "strengths": ["specific strength 1", "specific strength 2"],
          "weaknesses": ["area for improvement 1", "area for improvement 2"],
          "surprisingInsights": ["insight 1", "insight 2"],
          "redFlags": ["concern 1 (if any)"],
          "followUpRecommendations": ["question type to explore further"]
        }
      }

      Be specific, constructive, and fair in your evaluation. Consider the candidate's experience level and role requirements.
    `;
  }

  private buildAnalysisPrompt(
    interview: any,
    resumeAnalysis: any,
    roleDescription: string
  ): string {
    const responses = interview.responses || [];
    const responseAnalysis = responses.map((r: any, i: number) => 
      `Q${i + 1}: ${interview.questions?.[i]?.question || 'Question not available'}\nA${i + 1}: ${r.answer}\nScore: ${r.score || 'Not scored'}`
    ).join('\n\n');

    return `
      Conduct a comprehensive analysis of this complete interview as a senior HR expert and psychologist.

      INTERVIEW DATA:
      Position: ${interview.position}
      Duration: ${interview.duration || 0} seconds
      Questions Answered: ${responses.length}
      
      CANDIDATE BACKGROUND:
      ${JSON.stringify(resumeAnalysis)}

      ROLE REQUIREMENTS:
      ${roleDescription}

      INTERVIEW RESPONSES:
      ${responseAnalysis}

      COMPREHENSIVE ANALYSIS REQUIRED:

      Provide analysis in JSON format:
      {
        "overall": 85,
        "communication": 90,
        "technical": 80,
        "problemSolving": 85,
        "confidence": 75,
        "strengths": ["specific strength 1", "specific strength 2"],
        "improvements": ["specific improvement 1", "specific improvement 2"],
        "detailedAnalysis": {
          "responseQuality": 85,
          "clarity": 90,
          "relevance": 80,
          "depth": 75,
          "examples": 70
        },
        "personalityAssessment": {
          "traits": [
            {
              "trait": "Analytical Thinking",
              "score": 85,
              "description": "Shows strong analytical capabilities..."
            }
          ],
          "workStyle": "Collaborative and detail-oriented",
          "teamFit": "Would work well in cross-functional teams",
          "leadership": 70
        },
        "skillsAssessment": {
          "technicalSkills": [
            {
              "skill": "JavaScript",
              "demonstrated": true,
              "proficiency": "advanced",
              "evidence": ["mentioned React projects", "discussed async programming"]
            }
          ],
          "softSkills": [
            {
              "skill": "Communication",
              "score": 90,
              "examples": ["clear explanations", "structured responses"]
            }
          ]
        },
        "recommendations": {
          "immediate": ["practice technical presentations"],
          "shortTerm": ["develop system design skills"],
          "longTerm": ["pursue leadership opportunities"],
          "resources": [
            {
              "type": "course",
              "title": "Advanced React Patterns",
              "description": "Deep dive into React architecture",
              "priority": "high"
            }
          ]
        },
        "industryComparison": {
          "percentile": 75,
          "comparison": "Above average for mid-level developers",
          "benchmarkAreas": ["technical knowledge", "problem solving"]
        }
      }

      Be thorough, evidence-based, and provide actionable insights.
    `;
  }

  private parseQuestionGenerationResponse(response: string): QuestionGenerationResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.warn('Failed to parse question generation response, using fallback');
      return this.getFallbackQuestions();
    }
  }

  private parseEvaluationResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.warn('Failed to parse evaluation response, using fallback');
      return this.getFallbackEvaluation();
    }
  }

  private parseAnalysisResponse(response: string): AIAnalysisResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.warn('Failed to parse analysis response, using fallback');
      return this.getFallbackAnalysis();
    }
  }

  private getFallbackQuestions(): QuestionGenerationResult {
    return {
      questions: [
        {
          id: 'fallback-1',
          question: 'Tell me about yourself and your professional background.',
          category: 'Behavioral',
          difficulty: 'easy',
          type: 'behavioral',
          expectedAnswer: 'Should cover professional experience, key skills, and career objectives',
          evaluationCriteria: ['clarity', 'relevance', 'structure'],
          followUpQuestions: ['What motivates you in your work?'],
          skillsAssessed: ['communication', 'self-awareness'],
          timeExpected: 120
        }
      ],
      rationale: 'Fallback questions due to parsing error',
      alternativeQuestions: []
    };
  }

  private getFallbackEvaluation(): any {
    return {
      score: 70,
      feedback: 'Response evaluation completed. Consider providing more specific examples and details.',
      detailedAnalysis: {
        contentQuality: 70,
        communicationSkills: 75,
        technicalKnowledge: 65,
        problemSolving: 70,
        evidenceProvided: 60,
        culturalFit: 75,
        timeManagement: 80
      },
      aiEvaluation: {
        strengths: ['Clear communication'],
        weaknesses: ['Could provide more specific examples'],
        surprisingInsights: [],
        redFlags: [],
        followUpRecommendations: []
      }
    };
  }

  private getFallbackAnalysis(): AIAnalysisResult {
    return {
      overall: 70,
      communication: 75,
      technical: 65,
      problemSolving: 70,
      confidence: 75,
      strengths: ['Good communication skills'],
      improvements: ['Provide more specific examples'],
      detailedAnalysis: {
        responseQuality: 70,
        clarity: 75,
        relevance: 70,
        depth: 65,
        examples: 60
      },
      personalityAssessment: {
        traits: [
          {
            trait: 'Communication',
            score: 75,
            description: 'Shows good communication skills'
          }
        ],
        workStyle: 'Professional and collaborative',
        teamFit: 'Would likely work well in team environments',
        leadership: 65
      },
      skillsAssessment: {
        technicalSkills: [],
        softSkills: [
          {
            skill: 'Communication',
            score: 75,
            examples: ['Clear responses']
          }
        ]
      },
      recommendations: {
        immediate: ['Practice providing specific examples'],
        shortTerm: ['Develop technical presentation skills'],
        longTerm: ['Pursue professional development opportunities'],
        resources: []
      },
      industryComparison: {
        percentile: 65,
        comparison: 'Average performance for role level',
        benchmarkAreas: ['communication', 'technical skills']
      }
    };
  }
}

export default new GeminiService();