import { Router } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

// Basic payment endpoints
router.get('/', async (req, res) => {
  res.json({
    success: true,
    message: 'Get payments endpoint',
    data: { payments: [] }
  });
});

export default router;