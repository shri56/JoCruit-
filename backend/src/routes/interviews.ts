import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, checkPlanLimits } from '@/middleware/auth';
import interviewController from '@/controllers/interviewController';

const router = Router();

// All interview routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/interviews
 * @desc    Get user's interviews
 * @access  Private
 */
router.get('/', interviewController.getUserInterviews);

/**
 * @route   POST /api/interviews
 * @desc    Create new interview with AI-generated questions
 * @access  Private
 */
router.post('/', [
  checkPlanLimits('interviews'),
  body('position').trim().isLength({ min: 1 }).withMessage('Position is required'),
  body('roleDescription').optional().trim(),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('questionsCount').optional().isInt({ min: 1, max: 20 }),
  body('focusAreas').optional().isArray()
], interviewController.createInterview);

/**
 * @route   GET /api/interviews/:interviewId
 * @desc    Get interview details
 * @access  Private
 */
router.get('/:interviewId', interviewController.getInterview);

/**
 * @route   POST /api/interviews/:interviewId/start
 * @desc    Start interview session
 * @access  Private
 */
router.post('/:interviewId/start', interviewController.startInterview);

/**
 * @route   POST /api/interviews/:interviewId/answer
 * @desc    Submit answer to current question
 * @access  Private
 */
router.post('/:interviewId/answer', [
  body('questionIndex').isInt({ min: 0 }),
  body('answer').optional().trim(),
  body('timeTaken').isInt({ min: 0 }),
  body('audioFile').optional()
], interviewController.submitAnswer);

/**
 * @route   POST /api/interviews/:interviewId/complete
 * @desc    Complete interview and generate analysis
 * @access  Private
 */
router.post('/:interviewId/complete', interviewController.completeInterview);

/**
 * @route   POST /api/interviews/test-voice
 * @desc    Test voice settings
 * @access  Private
 */
router.post('/test-voice', [
  body('voiceSettings').isObject().withMessage('Voice settings are required')
], interviewController.testVoiceSettings);

/**
 * @route   GET /api/interviews/voices/available
 * @desc    Get available voices for TTS
 * @access  Private
 */
router.get('/voices/available', interviewController.getAvailableVoices);

/**
 * @route   GET /api/interviews/voices/recommendations
 * @desc    Get voice recommendations for role
 * @access  Private
 */
router.get('/voices/recommendations', interviewController.getVoiceRecommendations);

export default router;