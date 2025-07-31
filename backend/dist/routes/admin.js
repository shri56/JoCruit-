"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("@/models");
const auth_1 = require("@/middleware/auth");
const sync_1 = require("csv-parse/sync");
const router = (0, express_1.Router)();
// All admin routes require authentication and admin role
router.use(auth_1.authenticate);
router.use((req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
});
// Bulk upload users (CSV or JSON)
router.post('/bulk-upload', async (req, res) => {
    try {
        let users = [];
        if (req.is('application/json')) {
            users = req.body;
        }
        else if (req.is('text/csv') || req.is('application/csv')) {
            const csv = req.body;
            users = (0, sync_1.parse)(csv, { columns: true });
        }
        else {
            return res.status(400).json({ success: false, message: 'Unsupported content type' });
        }
        const created = [];
        for (const user of users) {
            if (!user.email || !user.firstName || !user.lastName)
                continue;
            // Default password for bulk upload (should be reset by user)
            const password = user.password || 'changeme123';
            const newUser = new models_1.User({ ...user, password, role: 'candidate' });
            await newUser.save();
            created.push(newUser.email);
        }
        res.json({ success: true, message: 'Users created', data: { created } });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Bulk upload failed', error: err.message });
    }
});
// Assign interview(s) to candidates
router.post('/assign-interview', async (req, res) => {
    try {
        const { candidateIds, interview } = req.body;
        if (!Array.isArray(candidateIds) || !interview) {
            return res.status(400).json({ success: false, message: 'candidateIds and interview required' });
        }
        const created = [];
        for (const candidateId of candidateIds) {
            const newInterview = new models_1.Interview({ ...interview, candidateId });
            await newInterview.save();
            created.push(newInterview._id);
        }
        res.json({ success: true, message: 'Interviews assigned', data: { created } });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Assignment failed', error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map