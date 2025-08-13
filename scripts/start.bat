#!/bin/bash
echo "🚀 Starting NaviHire Platform..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt

# Install frontend dependencies  
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Start backend
echo "🚀 Starting backend server..."
cd ../backend
python main.py