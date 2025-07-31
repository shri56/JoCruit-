import { Router } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

// Razorpay webhook endpoint
router.post('/razorpay', async (req, res) => {
  res.json({
    success: true,
    message: 'Razorpay webhook endpoint',
    data: { message: 'Webhook processing coming soon' }
  });
});

// COMMENTED OUT - Stripe webhook removed
// router.post('/stripe', async (req, res) => {
//   res.json({
//     success: true,
//     message: 'Stripe webhook endpoint',
//     data: { message: 'Webhook processing coming soon' }
//   });
// });

export default router;