"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
// All report routes require authentication
router.use(auth_1.authenticate);
// Basic report endpoints
router.get('/', async (req, res) => {
    res.json({
        success: true,
        message: 'Get reports endpoint',
        data: { reports: [] }
    });
});
exports.default = router;
//# sourceMappingURL=reports.js.map