import { Router, Response } from 'express';
import { authenticate } from '@/middleware/auth';
import { AuthenticatedRequest } from '@/types';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Basic user profile endpoint
router.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    message: 'User profile endpoint',
    data: { user: req.user }
  });
});

// GET /assigned-interviews - fetch interviews assigned to the logged-in user
router.get('/assigned-interviews', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const interviews = await (await import('@/models')).Interview.find({ candidateId: userId });
    res.json({ success: true, data: { interviews } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch assigned interviews', error: err.message });
  }
});

export default router;