# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites
```bash
# Install Node.js (18+)
# Install MongoDB
# Get your Gemini API key from Google AI Studio
```

### 2. Quick Setup
```bash
cd backend
npm install
cp .env.example .env
```

### 3. Configure Environment
Edit `.env` with minimum required values:
```env
MONGODB_URI=mongodb://localhost:27017/ai-interview-bot
JWT_SECRET=your-super-secret-key-here
REFRESH_TOKEN_SECRET=another-secret-key
GEMINI_API_KEY=your-gemini-api-key-here
```

### 4. Start the Server
```bash
npm run dev
```

## ✅ Test Your Setup

1. **Health Check**: Visit http://localhost:3001/health
2. **API Info**: Visit http://localhost:3001/api
3. **Register User**: 
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
   ```

## 🎯 Key Features Available

- ✅ **User Authentication** (Register, Login, JWT tokens)
- ✅ **Database Models** (Users, Interviews, Payments, Reports, Questions)
- ✅ **AI Integration** (Gemini API for interview evaluation)
- ✅ **Speech Services** (TTS/STT with Google Cloud)
- ✅ **Payment Processing** (Stripe & Razorpay integration)
- ✅ **Email Services** (SMTP with template support)
- ✅ **Report Generation** (PDF reports with analytics)
- ✅ **File Upload** (Resumes, audio files, avatars)
- ✅ **Security** (Rate limiting, CORS, Helmet, validation)
- ✅ **Logging** (Winston with multiple transports)

## 📱 Optional Services Setup

### Email Service (Optional)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Payment Gateways (Optional)
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

### Google Cloud Speech (Optional)
```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=path/to/service-account-key.json
```

## 🔧 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run linting
npm test             # Run tests (when added)
```

## 📂 Important Files

- `.env` - Environment configuration
- `src/server.ts` - Main server file
- `src/models/` - Database models
- `src/routes/` - API endpoints
- `src/services/` - Business logic
- `logs/` - Application logs

## 🐛 Troubleshooting

**MongoDB Connection Error**:
- Ensure MongoDB is running: `sudo systemctl start mongod`
- Check connection string in `.env`

**Port Already in Use**:
- Change `PORT=3001` in `.env` to another port

**API Key Errors**:
- Verify your Gemini API key is valid
- Check Google Cloud credentials (if using Speech APIs)

**Email Not Sending**:
- Check SMTP credentials
- For Gmail, use App Passwords instead of regular password

## 🎉 You're Ready!

Your AI Interview Bot backend is now fully functional with:
- Complete user management system
- AI-powered interview evaluation
- Payment processing capability
- Email notifications
- PDF report generation
- File upload handling
- Comprehensive API endpoints

The system is designed to be production-ready with proper error handling, logging, security measures, and scalability in mind.