"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
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
exports.default = router;
//# sourceMappingURL=payments.js.map