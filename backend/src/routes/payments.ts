import { Router } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

// PAYMENT INTEGRATION DISABLED FOR NOW
// All payment routes require authentication
// router.use(authenticate);

// Basic payment endpoints - DISABLED
router.get('/', async (req, res) => {
  res.json({
    success: true,
    message: 'Payment endpoints are currently disabled',
    data: { payments: [], disabled: true }
  });
});

// COMMENTED OUT - Original payment endpoints
// router.use(authenticate);
// router.get('/', async (req, res) => {
//   res.json({
//     success: true,
//     message: 'Get payments endpoint',
//     data: { payments: [] }
//   });
// });

export default router;