import { Router } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All report routes require authentication
router.use(authenticate);

// Basic report endpoints
router.get('/', async (req, res) => {
  res.json({
    success: true,
    message: 'Get reports endpoint',
    data: { reports: [] }
  });
});

export default router;