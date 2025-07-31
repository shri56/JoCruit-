const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'AI Interview Bot API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      interviews: '/api/interviews',
      questions: '/api/questions',
      reports: '/api/reports',
      payments: '/api/payments',
      uploads: '/api/uploads',
      admin: '/api/admin'
    }
  });
});

// Mock admin routes
app.post('/api/admin/bulk-upload', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Bulk upload endpoint - TypeScript version in development',
    data: { created: [] }
  });
});

app.post('/api/admin/assign-interview', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Assign interview endpoint - TypeScript version in development',
    data: { created: [] }
  });
});

// Mock user routes
app.get('/api/users/assigned-interviews', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Assigned interviews endpoint - TypeScript version in development',
    data: { interviews: [] }
  });
});

// Mock auth routes
app.post('/api/auth/login', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Login endpoint - TypeScript version in development',
    data: { token: 'mock-token' }
  });
});

app.post('/api/auth/register', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Register endpoint - TypeScript version in development',
    data: { user: { id: 'mock-user-id' } }
  });
});

// Mock payment routes
app.get('/api/payments', (req, res) => {
  res.json({
    success: true,
    message: 'Payment endpoints are currently disabled',
    data: { payments: [], disabled: true }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(process.cwd(), '..', 'JoCrruit', 'dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // Development mode - redirect to frontend dev server
  app.get('*', (req, res) => {
    res.json({
      success: true,
      message: 'AI Interview Bot Backend API (JavaScript Version)',
      frontend: process.env.CORS_ORIGIN || 'http://localhost:3000',
      api: `http://localhost:${PORT}/api`,
      note: 'This is a simplified JavaScript version while TypeScript issues are being resolved'
    });
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API info: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Note: This is a simplified JavaScript version while TypeScript issues are being resolved`);
});