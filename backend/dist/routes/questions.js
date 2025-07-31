"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const router = (0, express_1.Router)();
// All question routes require authentication
router.use(auth_1.authenticate);
// Basic question endpoints
router.get('/', async (req, res) => {
    res.json({
        success: true,
        message: 'Get questions endpoint',
        data: { questions: [] }
    });
});
exports.default = router;
//# sourceMappingURL=questions.js.map