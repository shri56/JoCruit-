import { Router } from 'express';
import { User, Interview } from '@/models';
import { authenticate } from '@/middleware/auth';
import { IUser, AuthenticatedRequest } from '@/types';
import { parse } from 'csv-parse/sync';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use((req: AuthenticatedRequest, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }
  next();
});

// Bulk upload users (CSV or JSON)
router.post('/bulk-upload', async (req: AuthenticatedRequest, res) => {
  try {
    let users: Partial<IUser>[] = [];
    if (req.is('application/json')) {
      users = req.body;
    } else if (req.is('text/csv') || req.is('application/csv')) {
      const csv = req.body;
      users = parse(csv, { columns: true });
    } else {
      res.status(400).json({ success: false, message: 'Unsupported content type' });
      return;
    }
    const created = [];
    for (const user of users) {
      if (!user.email || !user.firstName || !user.lastName) continue;
      // Default password for bulk upload (should be reset by user)
      const password = user.password || 'changeme123';
      const newUser = new User({ ...user, password, role: 'candidate' });
      await newUser.save();
      created.push(newUser.email);
    }
    res.json({ success: true, message: 'Users created', data: { created } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Bulk upload failed', error: err.message });
  }
});

// Assign interview(s) to candidates
router.post('/assign-interview', async (req: AuthenticatedRequest, res) => {
  try {
    const { candidateIds, interview } = req.body;
    if (!Array.isArray(candidateIds) || !interview) {
      res.status(400).json({ success: false, message: 'candidateIds and interview required' });
      return;
    }
    const created = [];
    for (const candidateId of candidateIds) {
      const newInterview = new Interview({ ...interview, candidateId });
      await newInterview.save();
      created.push(newInterview._id);
    }
    res.json({ success: true, message: 'Interviews assigned', data: { created } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Assignment failed', error: err.message });
  }
});

export default router;