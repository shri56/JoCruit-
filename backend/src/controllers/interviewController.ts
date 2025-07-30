import { Response } from 'express';
import { validationResult } from 'express-validator';
import { Interview, User, QuestionBank } from '@/models';
import { AuthenticatedRequest } from '@/types';
import GeminiService from '@/services/geminiService';
import TTSService from '@/services/ttsService';
import STTService from '@/services/sttService';
import ResumeAnalysisService from '@/services/resumeAnalysisService';
import ReportService from '@/services/ReportService';
import EmailService from '@/services/EmailService';
import logger from '@/utils/logger';

class InterviewController {
  
  /**
   * Create new interview with resume-based question generation
   */
  async createInterview(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        title,
        position,
        roleDescription,
        difficulty = 'medium',
        questionsCount = 10,
        resumeFile,
        voiceSettings,
        focusAreas = []
      } = req.body;

      const candidateId = req.user!._id;

      // Analyze resume if provided
      let resumeAnalysis: any = null;
      if (resumeFile) {
        resumeAnalysis = await ResumeAnalysisService.analyzeResume(
          resumeFile.path,
          resumeFile.type
        );
      }

      // Generate role-specific questions using AI
      let questions;
      if (resumeAnalysis && roleDescription) {
        const questionResult = await GeminiService.generateInterviewQuestions(
          resumeAnalysis,
          roleDescription,
          questionsCount,
          difficulty,
          focusAreas
        );
        questions = questionResult.questions;
      } else {
        // Fallback to question bank
        questions = await QuestionBank.getRandomQuestions(questionsCount, {
          difficulty,
          category: focusAreas.length > 0 ? focusAreas[0] : undefined
        });
      }

      // Generate audio for questions if voice settings provided
      const questionsWithAudio = [];
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        let audioUrl = null;

        if (voiceSettings?.enabled) {
          try {
            audioUrl = await TTSService.generateQuestionAudio(
              question.question,
              `temp_${Date.now()}`,
              i,
              voiceSettings
            );
          } catch (audioError) {
            logger.warn('Failed to generate audio for question:', audioError);
          }
        }

        questionsWithAudio.push({
          ...question,
          audioUrl
        });
      }

      // Create interview record
      const interview = new Interview({
        candidateId,
        title: title || `${position} Interview`,
        position,
        roleDescription,
        difficulty,
        type: 'ai_generated',
        questions: questionsWithAudio,
        resumeAnalysis,
        settings: {
          voiceSettings,
          timeLimit: 3600, // 1 hour default
          questionsCount,
          focusAreas
        },
        status: 'created'
      });

      await interview.save();

      logger.info('Interview created with AI-generated questions', {
        interviewId: interview._id,
        candidateId,
        questionsCount: questions.length,
        hasResume: !!resumeAnalysis,
        hasAudio: !!voiceSettings?.enabled
      });

      res.status(201).json({
        success: true,
        message: 'Interview created successfully',
        data: {
          interview: {
            id: interview._id,
            title: interview.title,
            position: interview.position,
            difficulty: interview.difficulty,
            questionsCount: questions.length,
            hasAudio: !!voiceSettings?.enabled,
            resumeAnalysis: resumeAnalysis ? {
              skills: resumeAnalysis.skills,
              experience: resumeAnalysis.experience.length,
              keyStrengths: resumeAnalysis.keyStrengths
            } : null,
            status: interview.status,
            createdAt: interview.createdAt
          }
        }
      });

    } catch (error) {
      logger.error('Error creating interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create interview'
      });
    }
  }

  /**
   * Start interview session
   */
  async startInterview(req: AuthenticatedRequest, res: Response) {
    try {
      const { interviewId } = req.params;
      const interview = await Interview.findById(interviewId);

      if (!interview) {
        return res.status(404).json({
          success: false,
          message: 'Interview not found'
        });
      }

      if (interview.candidateId.toString() !== req.user!._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this interview'
        });
      }

      if (interview.status !== 'created') {
        return res.status(400).json({
          success: false,
          message: 'Interview cannot be started'
        });
      }

      // Update interview status
      interview.status = 'in_progress';
      interview.startedAt = new Date();
      await interview.save();

      // Get first question with audio
      const firstQuestion = interview.questions[0];
      
      logger.info('Interview started', {
        interviewId,
        candidateId: req.user!._id
      });

      res.json({
        success: true,
        message: 'Interview started successfully',
        data: {
          interview: {
            id: interview._id,
            currentQuestionIndex: 0,
            totalQuestions: interview.questions.length,
            timeLimit: interview.settings?.timeLimit || 3600,
            status: interview.status
          },
          currentQuestion: {
            index: 0,
            question: firstQuestion.question,
            category: firstQuestion.category,
            audioUrl: firstQuestion.audioUrl,
            timeExpected: firstQuestion.timeExpected || 120
          }
        }
      });

    } catch (error) {
      logger.error('Error starting interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start interview'
      });
    }
  }

  /**
   * Submit answer to current question
   */
  async submitAnswer(req: AuthenticatedRequest, res: Response) {
    try {
      const { interviewId } = req.params;
      const { questionIndex, answer, timeTaken, audioFile } = req.body;

      const interview = await Interview.findById(interviewId);
      if (!interview || interview.candidateId.toString() !== req.user!._id.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Interview not found'
        });
      }

      if (interview.status !== 'in_progress') {
        return res.status(400).json({
          success: false,
          message: 'Interview is not in progress'
        });
      }

      // Convert audio to text if provided
      let finalAnswer = answer;
      if (audioFile && !answer) {
        try {
          const transcription = await STTService.transcribeAudioFile(audioFile.path);
          finalAnswer = transcription.transcript;
        } catch (sttError) {
          logger.warn('Failed to transcribe audio, using text answer:', sttError);
        }
      }

      const question = interview.questions[questionIndex];
      if (!question) {
        return res.status(400).json({
          success: false,
          message: 'Invalid question index'
        });
      }

      // Evaluate answer using AI
      const evaluation = await GeminiService.evaluateResponse(
        question,
        finalAnswer,
        interview.resumeAnalysis,
        interview.roleDescription,
        timeTaken
      );

      // Save response
      const response = {
        questionIndex,
        answer: finalAnswer,
        timeTaken,
        audioFile: audioFile?.path,
        score: evaluation.score,
        aiEvaluation: evaluation.aiEvaluation,
        feedback: evaluation.feedback,
        submittedAt: new Date()
      };

      if (!interview.responses) {
        interview.responses = [];
      }
      interview.responses.push(response);

      // Generate follow-up questions if needed
      const followUpQuestions = await GeminiService.generateFollowUpQuestions(
        question,
        finalAnswer,
        { resumeAnalysis: interview.resumeAnalysis, roleDescription: interview.roleDescription }
      );

      await interview.save();

      logger.info('Answer submitted and evaluated', {
        interviewId,
        questionIndex,
        score: evaluation.score,
        timeTaken
      });

      // Prepare next question or completion
      let nextQuestion = null;
      const isLastQuestion = questionIndex >= interview.questions.length - 1;
      
      if (!isLastQuestion) {
        const nextQ = interview.questions[questionIndex + 1];
        nextQuestion = {
          index: questionIndex + 1,
          question: nextQ.question,
          category: nextQ.category,
          audioUrl: nextQ.audioUrl,
          timeExpected: nextQ.timeExpected || 120
        };
      }

      res.json({
        success: true,
        message: 'Answer submitted successfully',
        data: {
          evaluation: {
            score: evaluation.score,
            feedback: evaluation.feedback,
            detailedAnalysis: evaluation.detailedAnalysis
          },
          followUpQuestions: followUpQuestions.slice(0, 2), // Max 2 follow-ups
          nextQuestion,
          isLastQuestion,
          progress: {
            answered: interview.responses.length,
            total: interview.questions.length,
            percentage: Math.round((interview.responses.length / interview.questions.length) * 100)
          }
        }
      });

    } catch (error) {
      logger.error('Error submitting answer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit answer'
      });
    }
  }

  /**
   * Complete interview and generate analysis
   */
  async completeInterview(req: AuthenticatedRequest, res: Response) {
    try {
      const { interviewId } = req.params;
      const interview = await Interview.findById(interviewId);

      if (!interview || interview.candidateId.toString() !== req.user!._id.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Interview not found'
        });
      }

      if (interview.status !== 'in_progress') {
        return res.status(400).json({
          success: false,
          message: 'Interview is not in progress'
        });
      }

      // Calculate overall statistics
      const responses = interview.responses || [];
      const totalTime = responses.reduce((sum, r) => sum + r.timeTaken, 0);
      const averageScore = responses.length > 0 
        ? Math.round(responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length)
        : 0;

      // Generate comprehensive AI analysis
      const aiAnalysis = await GeminiService.generateInterviewAnalysis(
        interview,
        interview.resumeAnalysis,
        interview.roleDescription
      );

      // Update interview
      interview.status = 'completed';
      interview.completedAt = new Date();
      interview.duration = totalTime;
      interview.overallScore = averageScore;
      interview.aiAnalysis = aiAnalysis;
      await interview.save();

      // Generate and send report
      let reportGenerated = false;
      try {
        const reportResult = await ReportService.generateInterviewReport(interviewId);
        reportGenerated = true;

        // Send report by email if user preference allows
        const user = await User.findById(req.user!._id);
        if (user?.preferences?.emailNotifications) {
          await EmailService.sendInterviewCompleted({
            userEmail: user.email,
            userName: user.firstName,
            interviewTitle: interview.title,
            position: interview.position,
            score: averageScore,
            reportUrl: reportResult.reportUrl
          });
        }
      } catch (reportError) {
        logger.error('Failed to generate report:', reportError);
      }

      logger.info('Interview completed', {
        interviewId,
        candidateId: req.user!._id,
        overallScore: averageScore,
        duration: totalTime,
        reportGenerated
      });

      res.json({
        success: true,
        message: 'Interview completed successfully',
        data: {
          interview: {
            id: interview._id,
            overallScore: averageScore,
            duration: totalTime,
            completedAt: interview.completedAt,
            status: interview.status
          },
          analysis: {
            overall: aiAnalysis.overall,
            communication: aiAnalysis.communication,
            technical: aiAnalysis.technical,
            problemSolving: aiAnalysis.problemSolving,
            confidence: aiAnalysis.confidence,
            strengths: aiAnalysis.strengths,
            improvements: aiAnalysis.improvements
          },
          personalityAssessment: aiAnalysis.personalityAssessment,
          recommendations: aiAnalysis.recommendations,
          reportGenerated
        }
      });

    } catch (error) {
      logger.error('Error completing interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete interview'
      });
    }
  }

  /**
   * Get interview details
   */
  async getInterview(req: AuthenticatedRequest, res: Response) {
    try {
      const { interviewId } = req.params;
      const interview = await Interview.findById(interviewId);

      if (!interview) {
        return res.status(404).json({
          success: false,
          message: 'Interview not found'
        });
      }

      // Check authorization
      if (interview.candidateId.toString() !== req.user!._id.toString() && 
          req.user!.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this interview'
        });
      }

      res.json({
        success: true,
        data: {
          interview: {
            id: interview._id,
            title: interview.title,
            position: interview.position,
            difficulty: interview.difficulty,
            status: interview.status,
            overallScore: interview.overallScore,
            duration: interview.duration,
            createdAt: interview.createdAt,
            startedAt: interview.startedAt,
            completedAt: interview.completedAt,
            questionsCount: interview.questions?.length || 0,
            answeredCount: interview.responses?.length || 0,
            resumeAnalysis: interview.resumeAnalysis,
            aiAnalysis: interview.aiAnalysis,
            reportUrl: interview.reportUrl
          }
        }
      });

    } catch (error) {
      logger.error('Error getting interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get interview'
      });
    }
  }

  /**
   * Get user's interviews
   */
  async getUserInterviews(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const candidateId = req.user!._id;

      const query: any = { candidateId };
      if (status) query.status = status;

      const total = await Interview.countDocuments(query);
      const interviews = await Interview.find(query)
        .select('title position difficulty status overallScore duration createdAt completedAt')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      res.json({
        success: true,
        data: {
          interviews,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Error getting user interviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get interviews'
      });
    }
  }

  /**
   * Test voice settings
   */
  async testVoiceSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const { voiceSettings } = req.body;

      if (!voiceSettings) {
        return res.status(400).json({
          success: false,
          message: 'Voice settings are required'
        });
      }

      const testResult = await TTSService.testVoiceSettings(voiceSettings);

      res.json({
        success: true,
        message: 'Voice test completed',
        data: {
          audioBuffer: testResult.audioBuffer?.toString('base64'),
          voiceUsed: testResult.voiceUsed,
          duration: testResult.duration
        }
      });

    } catch (error) {
      logger.error('Error testing voice settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test voice settings'
      });
    }
  }

  /**
   * Get available voices
   */
  async getAvailableVoices(req: AuthenticatedRequest, res: Response) {
    try {
      const { languageCode } = req.query;
      const voices = await TTSService.getAvailableVoices(languageCode as string);

      res.json({
        success: true,
        data: { voices }
      });

    } catch (error) {
      logger.error('Error getting available voices:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available voices'
      });
    }
  }

  /**
   * Get voice recommendations for role
   */
  async getVoiceRecommendations(req: AuthenticatedRequest, res: Response) {
    try {
      const { role } = req.query;
      
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role parameter is required'
        });
      }

      const recommendations = TTSService.getVoiceRecommendations(
        role as string,
        req.user!.preferences
      );

      res.json({
        success: true,
        data: { recommendations }
      });

    } catch (error) {
      logger.error('Error getting voice recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get voice recommendations'
      });
    }
  }
}

export default new InterviewController();