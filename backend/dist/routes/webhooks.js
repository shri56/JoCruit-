"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
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
exports.default = router;
//# sourceMappingURL=webhooks.js.map