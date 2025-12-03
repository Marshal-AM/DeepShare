#!/bin/bash

# DeepShare Story Protocol Server Startup Script

echo "🚀 Starting DeepShare Story Protocol Server..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Creating from example..."
    cp .env.example .env
fi

# Start the server
echo "✅ Starting server on port 3003..."
npm start

