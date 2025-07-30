import { Router } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All interview routes require authentication
router.use(authenticate);

// Basic interview endpoints
router.get('/', async (req, res) => {
  res.json({
    success: true,
    message: 'Get interviews endpoint',
    data: { interviews: [] }
  });
});

router.post('/', async (req, res) => {
  res.json({
    success: true,
    message: 'Create interview endpoint',
    data: { interview: { id: 'temp-id', ...req.body } }
  });
});

export default router;