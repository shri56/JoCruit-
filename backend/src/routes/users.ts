import { Router } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Basic user profile endpoint
router.get('/profile', async (req, res) => {
  res.json({
    success: true,
    message: 'User profile endpoint',
    data: { user: req.user }
  });
});

export default router;