import { Router } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All question routes require authentication
router.use(authenticate);

// Basic question endpoints
router.get('/', async (req, res) => {
  res.json({
    success: true,
    message: 'Get questions endpoint',
    data: { questions: [] }
  });
});

export default router;