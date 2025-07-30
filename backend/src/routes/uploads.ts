import { Router } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

// Basic upload endpoints
router.post('/file', async (req, res) => {
  res.json({
    success: true,
    message: 'File upload endpoint',
    data: { message: 'Upload functionality coming soon' }
  });
});

export default router;