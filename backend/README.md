# AI Interview Bot Backend

A comprehensive backend system for an AI-powered interview platform featuring speech-to-text, text-to-speech, AI evaluation using Google Gemini, payment processing, and automated report generation.

## 🚀 Advanced Features

- **🤖 AI-Powered Interview System**: 
  - Resume-based question generation using Google Gemini
  - Intelligent answer evaluation with detailed feedback
  - Comprehensive personality and skills assessment
  - Industry benchmarking and performance comparison

- **🎵 Advanced Speech Technology**:
  - Customizable Text-to-Speech with voice selection
  - Role-specific voice recommendations
  - High-quality Speech-to-Text transcription
  - Real-time audio processing and analysis

- **📄 Resume Intelligence**:
  - AI-powered resume analysis and skill extraction
  - Role-specific question generation based on candidate background
  - Skills matching against job requirements
  - Experience-based interview customization

- **📊 Comprehensive Analytics & Reporting**:
  - AI-generated detailed interview reports
  - Personality assessment and team fit analysis
  - Performance trends and skill development tracking
  - Personalized improvement recommendations

- **🔐 Enterprise-Grade Security**:
  - JWT-based authentication with role management
  - Subscription-based access control
  - Rate limiting and API protection
  - Secure file handling and storage

- **💳 Payment & Subscription Management**:
  - Multi-gateway support (Stripe & Razorpay)
  - Flexible subscription plans with usage limits
  - Automated billing and invoice generation
  - Webhook-based payment processing

- **📧 Intelligent Communication**:
  - Automated email notifications with templates
  - Report delivery and sharing
  - Interview scheduling and reminders
  - Multi-language support

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- Redis (optional, for session management)
- Google Cloud Platform account (for Speech services)
- Gemini API key
- Stripe/Razorpay account (for payments)
- SMTP email service

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in the environment variables in `.env`:

   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000

   # Database
   MONGODB_URI=mongodb://localhost:27017/ai-interview-bot
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

   # Gemini AI API
   GEMINI_API_KEY=your_gemini_api_key_here

   # Google Cloud Services (optional)
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_KEY_FILE=path/to/service-account-key.json

   # Email Service
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   FROM_EMAIL=noreply@yourapp.com
   FROM_NAME=AI Interview Bot

   # Payment Gateways (optional)
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret

   # Admin Configuration
   ADMIN_EMAIL=admin@yourapp.com
   ADMIN_DEFAULT_PASSWORD=change_this_password
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Interview Endpoints

#### Create Interview
```http
POST /api/interviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Frontend Developer Interview",
  "position": "Frontend Developer",
  "difficulty": "medium",
  "type": "technical",
  "questionsCount": 5
}
```

#### Start Interview
```http
POST /api/interviews/:id/start
Authorization: Bearer <token>
```

#### Submit Answer
```http
POST /api/interviews/:id/answer
Authorization: Bearer <token>
Content-Type: application/json

{
  "questionId": "question_id",
  "answer": "My answer text",
  "timeTaken": 120
}
```

#### Complete Interview
```http
POST /api/interviews/:id/complete
Authorization: Bearer <token>
```

### Question Endpoints

#### Get Questions
```http
GET /api/questions?category=technical&difficulty=medium
Authorization: Bearer <token>
```

#### Create Question (Admin only)
```http
POST /api/questions
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Question Title",
  "question": "What is React?",
  "category": "Technical",
  "difficulty": "easy",
  "type": "open_ended",
  "expectedAnswer": "React is a JavaScript library..."
}
```

### Report Endpoints

#### Generate Report
```http
POST /api/reports/interview/:interviewId
Authorization: Bearer <token>
```

#### Get User Reports
```http
GET /api/reports/user/:userId
Authorization: Bearer <token>
```

#### Download Report
```http
GET /api/reports/:reportId/download
Authorization: Bearer <token>
```

### Payment Endpoints

#### Create Payment Intent
```http
POST /api/payments/create-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "premium",
  "billingPeriod": "monthly",
  "paymentMethod": "stripe"
}
```

### Upload Endpoints

#### Upload File
```http
POST /api/uploads/file
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form data:
- file: <file>
- type: "resume" | "audio" | "avatar"
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3001 |
| `NODE_ENV` | Environment | No | development |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `GEMINI_API_KEY` | Google Gemini API key | Yes | - |
| `SMTP_HOST` | Email SMTP host | No | - |
| `SMTP_USER` | Email username | No | - |
| `SMTP_PASS` | Email password | No | - |

### Subscription Plans

The system supports multiple subscription tiers:

- **Free**: 5 interviews/month, 5 reports/month, 1GB storage
- **Basic**: 50 interviews/month, 50 reports/month, 5GB storage
- **Premium**: 200 interviews/month, 200 reports/month, 20GB storage
- **Enterprise**: Unlimited interviews, reports, 100GB storage

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── server.ts        # Main server file
├── uploads/             # File storage
├── logs/               # Log files
├── .env.example        # Environment variables template
├── package.json        # Dependencies
└── tsconfig.json       # TypeScript configuration
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Validates all incoming data
- **CORS Protection**: Configurable cross-origin policies
- **Helmet.js**: Security headers
- **Password Hashing**: bcrypt for secure password storage
- **Role-based Access**: Different permission levels

## 🚦 Health Monitoring

### Health Check
```http
GET /health
```

Returns server status, database connectivity, and uptime information.

### Logging

The application uses Winston for comprehensive logging:
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`
- Console output in development

## 🔄 API Response Format

All API responses follow a consistent format:

```json
{
  "success": true|false,
  "message": "Response message",
  "data": {
    // Response data
  },
  "error": "Error message (only on failure)",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## 🛡️ Error Handling

The API includes comprehensive error handling:

- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate resources)
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

## 📊 Features Overview

### AI Interview System
- Generate questions using Gemini AI
- Real-time answer evaluation
- Comprehensive scoring system
- Detailed feedback generation

### Speech Services
- Convert text to speech for questions
- Convert speech to text for answers
- Multiple language support
- Audio quality analysis

### Payment Integration
- Stripe and Razorpay support
- Subscription management
- Webhook handling
- Invoice generation

### Report Generation
- PDF report creation
- Performance analytics
- Email delivery
- Historical tracking

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### Environment Setup for Production
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure proper MongoDB connection
- Set up SSL certificates
- Configure reverse proxy (nginx)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the logs for error details

## 🔮 Future Enhancements

- WebRTC integration for video interviews
- AI-powered question generation
- Advanced analytics dashboard
- Mobile app support
- Multi-language support
- Integration with ATS systems

---

## Quick Start Guide

1. **Install dependencies**: `npm install`
2. **Set up environment**: Copy `.env.example` to `.env` and fill in required values
3. **Start MongoDB**: Ensure MongoDB is running
4. **Run development server**: `npm run dev`
5. **Test the API**: Visit `http://localhost:3001/health`

The server will automatically:
- Connect to MongoDB
- Create necessary indexes
- Seed initial data (admin user and sample questions)
- Start listening on the configured port

**Minimum Required Environment Variables for Quick Start:**
```env
MONGODB_URI=mongodb://localhost:27017/ai-interview-bot
JWT_SECRET=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key
```

That's it! Your AI Interview Bot backend is ready to use! 🎉