import fs from 'fs';
import path from 'path';
import GeminiService from './geminiService';
import logger from '@/utils/logger';

class ResumeAnalysisService {
  
  /**
   * Analyze resume and extract key information
   */
  async analyzeResume(filePath: string, fileType: string): Promise<{
    skills: string[];
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    education: Array<{
      degree: string;
      institution: string;
      year: string;
    }>;
    summary: string;
    keyStrengths: string[];
    relevantExperience: string[];
  }> {
    try {
      let resumeText = '';

      // Extract text based on file type
      if (fileType === 'pdf') {
        resumeText = await this.extractTextFromPDF(filePath);
      } else if (fileType === 'docx') {
        resumeText = await this.extractTextFromDocx(filePath);
      } else {
        resumeText = await this.extractTextFromPlainText(filePath);
      }

      // Use Gemini to analyze the resume
      const analysisPrompt = `
        Analyze the following resume and extract structured information:

        Resume Text:
        ${resumeText}

        Please extract and return the following information in JSON format:
        {
          "skills": ["list of technical and soft skills"],
          "experience": [
            {
              "title": "job title",
              "company": "company name",
              "duration": "employment duration",
              "description": "brief description of role"
            }
          ],
          "education": [
            {
              "degree": "degree/certification name",
              "institution": "institution name",
              "year": "year of completion"
            }
          ],
          "summary": "brief professional summary",
          "keyStrengths": ["list of key strengths identified"],
          "relevantExperience": ["list of most relevant experiences"]
        }

        Focus on extracting accurate, specific information. If information is not clearly stated, use "Not specified" for that field.
      `;

      const analysis = await GeminiService.generateContent(analysisPrompt);
      
      // Parse the JSON response
      let parsedAnalysis;
      try {
        // Extract JSON from the response
        const jsonMatch = analysis.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedAnalysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        logger.warn('Failed to parse Gemini response as JSON, using fallback analysis');
        parsedAnalysis = await this.fallbackAnalysis(resumeText);
      }

      logger.info('Resume analyzed successfully', {
        skillsCount: parsedAnalysis.skills?.length || 0,
        experienceCount: parsedAnalysis.experience?.length || 0,
        educationCount: parsedAnalysis.education?.length || 0
      });

      return parsedAnalysis;

    } catch (error) {
      logger.error('Error analyzing resume:', error);
      throw new Error('Failed to analyze resume');
    }
  }

  /**
   * Generate role-specific questions based on resume and job description
   */
  async generateRoleSpecificQuestions(
    resumeAnalysis: any,
    roleDescription: string,
    questionCount: number = 10,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<Array<{
    question: string;
    category: string;
    type: string;
    expectedAnswer: string;
    skillsFocused: string[];
    relevanceScore: number;
  }>> {
    try {
      const questionPrompt = `
        Based on the following resume analysis and role description, generate ${questionCount} interview questions:

        Resume Analysis:
        Skills: ${resumeAnalysis.skills?.join(', ') || 'None specified'}
        Experience: ${JSON.stringify(resumeAnalysis.experience || [])}
        Key Strengths: ${resumeAnalysis.keyStrengths?.join(', ') || 'None specified'}
        
        Role Description:
        ${roleDescription}

        Generate questions with difficulty level: ${difficulty}

        Return a JSON array of questions in this format:
        [
          {
            "question": "Detailed interview question",
            "category": "Technical|Behavioral|Problem-solving|Experience-based",
            "type": "open_ended|scenario_based|technical_challenge",
            "expectedAnswer": "What a good answer should include",
            "skillsFocused": ["specific skills this question tests"],
            "relevanceScore": 1-10 (how relevant to candidate's background)
          }
        ]

        Guidelines:
        - Mix technical and behavioral questions
        - Focus on skills mentioned in resume
        - Include scenario-based questions for experience
        - Ensure questions are relevant to the role
        - Vary difficulty within the specified level
        - Ask about specific technologies/tools mentioned in resume
      `;

      const response = await GeminiService.generateContent(questionPrompt);
      
      // Parse the JSON response
      let questions;
      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON array found in response');
        }
      } catch (parseError) {
        logger.warn('Failed to parse questions JSON, generating fallback questions');
        questions = await this.generateFallbackQuestions(resumeAnalysis, roleDescription, questionCount);
      }

      // Validate and clean questions
      const validQuestions = questions.filter((q: any) => 
        q.question && q.category && q.type && q.expectedAnswer
      ).slice(0, questionCount);

      logger.info('Generated role-specific questions', {
        requestedCount: questionCount,
        generatedCount: validQuestions.length,
        categories: [...new Set(validQuestions.map((q: any) => q.category))]
      });

      return validQuestions;

    } catch (error) {
      logger.error('Error generating role-specific questions:', error);
      throw new Error('Failed to generate questions');
    }
  }

  /**
   * Match candidate skills with role requirements
   */
  async matchSkillsToRole(resumeAnalysis: any, roleDescription: string): Promise<{
    matchedSkills: Array<{
      skill: string;
      proficiency: 'beginner' | 'intermediate' | 'advanced';
      relevance: number;
    }>;
    missingSkills: string[];
    overallMatch: number;
    recommendations: string[];
  }> {
    try {
      const matchingPrompt = `
        Analyze how well the candidate's skills match the role requirements:

        Candidate Skills: ${resumeAnalysis.skills?.join(', ') || 'None specified'}
        Candidate Experience: ${JSON.stringify(resumeAnalysis.experience || [])}
        
        Role Description:
        ${roleDescription}

        Provide analysis in JSON format:
        {
          "matchedSkills": [
            {
              "skill": "skill name",
              "proficiency": "beginner|intermediate|advanced",
              "relevance": 1-10
            }
          ],
          "missingSkills": ["skills required for role but not in resume"],
          "overallMatch": 1-100,
          "recommendations": ["specific recommendations for improvement"]
        }
      `;

      const response = await GeminiService.generateContent(matchingPrompt);
      
      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      logger.info('Skills matching completed', {
        matchedSkills: analysis.matchedSkills?.length || 0,
        missingSkills: analysis.missingSkills?.length || 0,
        overallMatch: analysis.overallMatch
      });

      return analysis;

    } catch (error) {
      logger.error('Error matching skills to role:', error);
      throw new Error('Failed to analyze skill match');
    }
  }

  // Private helper methods

  private async extractTextFromPDF(filePath: string): Promise<string> {
    // For now, return a placeholder. In production, use pdf-parse or similar
    try {
      // This would normally use a PDF parsing library
      logger.warn('PDF parsing not fully implemented, using fallback');
      return 'PDF content extraction not yet implemented';
    } catch (error) {
      logger.error('Error extracting PDF text:', error);
      return '';
    }
  }

  private async extractTextFromDocx(filePath: string): Promise<string> {
    // For now, return a placeholder. In production, use mammoth.js or similar
    try {
      logger.warn('DOCX parsing not fully implemented, using fallback');
      return 'DOCX content extraction not yet implemented';
    } catch (error) {
      logger.error('Error extracting DOCX text:', error);
      return '';
    }
  }

  private async extractTextFromPlainText(filePath: string): Promise<string> {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      logger.error('Error reading text file:', error);
      return '';
    }
  }

  private async fallbackAnalysis(resumeText: string): Promise<any> {
    // Basic keyword extraction as fallback
    const skillKeywords = [
      'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'MongoDB',
      'AWS', 'Docker', 'Git', 'TypeScript', 'HTML', 'CSS', 'Java',
      'Leadership', 'Communication', 'Problem-solving', 'Teamwork'
    ];

    const foundSkills = skillKeywords.filter(skill => 
      resumeText.toLowerCase().includes(skill.toLowerCase())
    );

    return {
      skills: foundSkills,
      experience: [],
      education: [],
      summary: 'Resume analysis using fallback method',
      keyStrengths: foundSkills.slice(0, 3),
      relevantExperience: []
    };
  }

  private async generateFallbackQuestions(
    resumeAnalysis: any,
    roleDescription: string,
    count: number
  ): Promise<any[]> {
    const fallbackQuestions = [
      {
        question: "Tell me about your background and experience",
        category: "Behavioral",
        type: "open_ended",
        expectedAnswer: "Should cover professional background and key experiences",
        skillsFocused: ["Communication"],
        relevanceScore: 8
      },
      {
        question: "What interests you about this role?",
        category: "Behavioral", 
        type: "open_ended",
        expectedAnswer: "Should show research about role and genuine interest",
        skillsFocused: ["Motivation"],
        relevanceScore: 7
      },
      {
        question: "Describe a challenging project you worked on",
        category: "Experience-based",
        type: "scenario_based", 
        expectedAnswer: "Should use STAR method and demonstrate problem-solving",
        skillsFocused: ["Problem-solving"],
        relevanceScore: 8
      }
    ];

    return fallbackQuestions.slice(0, count);
  }
}

export default new ResumeAnalysisService();