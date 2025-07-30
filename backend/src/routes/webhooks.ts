import { Router } from 'express';

const router = Router();

// Webhook endpoints (no authentication required)
router.post('/stripe', async (req, res) => {
  res.json({
    success: true,
    message: 'Stripe webhook endpoint',
    data: { received: true }
  });
});

router.post('/razorpay', async (req, res) => {
  res.json({
    success: true,
    message: 'Razorpay webhook endpoint',
    data: { received: true }
  });
});

export default router;