#!/bin/bash

# AI Interview Bot Backend Startup Script
echo "🚀 Starting AI Interview Bot Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x mongod > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   You can start it with: sudo systemctl start mongod"
    echo "   Or: brew services start mongodb-community (on macOS)"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit the .env file with your configuration before starting the server."
    echo "   Required: MONGODB_URI, JWT_SECRET, GEMINI_API_KEY"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads/audio/tts
mkdir -p uploads/audio/recordings
mkdir -p uploads/files/resumes
mkdir -p uploads/files/avatars
mkdir -p uploads/reports
mkdir -p logs

# Build the project
echo "🔨 Building the project..."
npm run build

# Start the development server
echo "🚀 Starting the development server..."
echo "   API will be available at: http://localhost:3001/api"
echo "   Health check: http://localhost:3001/health"
echo ""
echo "   Press Ctrl+C to stop the server"
echo ""

npm run dev