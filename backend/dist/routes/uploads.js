"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
// All upload routes require authentication
router.use(auth_1.authenticate);
// Basic upload endpoints
router.post('/file', async (req, res) => {
    res.json({
        success: true,
        message: 'File upload endpoint',
        data: { message: 'Upload functionality coming soon' }
    });
});
exports.default = router;
//# sourceMappingURL=uploads.js.map