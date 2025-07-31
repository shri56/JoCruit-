"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
// All interview routes require authentication
router.use(auth_1.authenticate);
// Basic interview endpoints
router.get('/', async (req, res) => {
    res.json({
        success: true,
        message: 'Get interviews endpoint',
        data: { interviews: [] }
    });
});
router.post('/', async (req, res) => {
    res.json({
        success: true,
        message: 'Create interview endpoint',
        data: { interview: { id: 'temp-id', ...req.body } }
    });
});
exports.default = router;
//# sourceMappingURL=interviews.js.map