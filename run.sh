#!/bin/bash

echo "🚀 Dual Agent Conversation Platform"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please ensure your .env file exists with OPENROUTER_API_KEY"
    exit 1
fi

# Source .env and check API key
source .env
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "❌ Error: OPENROUTER_API_KEY not set in .env file!"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Function to check if port is in use
check_port() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Clean up any existing processes
echo "🧹 Cleaning up existing processes..."
if check_port 3000; then
    echo "   Killing process on port 3000"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

if check_port 3001; then
    echo "   Killing process on port 3001"
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
fi

sleep 1

# Start backend
echo "🔧 Starting backend server..."
npm start &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
for i in {1..10}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ Backend failed to start in 10 seconds"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Start frontend
echo "🌐 Starting frontend server..."
cd frontend && python3 -m http.server 3001 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to start..."
for i in {1..5}; do
    if curl -s http://localhost:3001/ > /dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    if [ $i -eq 5 ]; then
        echo "❌ Frontend failed to start in 5 seconds"
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Run connection test
echo "🧪 Running connection test..."
if node test-connection.js > /dev/null 2>&1; then
    echo "✅ All systems operational!"
else
    echo "⚠️  Some tests failed, but servers are running"
fi

echo ""
echo "🎉 Application is ready!"
echo ""
echo "🌐 Main Application:    http://localhost:3001"
echo "🧪 API Test Page:       http://localhost:3001/test-api.html"
echo "📊 Backend API:         http://localhost:3000"
echo ""
echo "📝 Instructions:"
echo "   1. Open http://localhost:3001 in your browser"
echo "   2. Choose a conversation scenario"
echo "   3. Watch AI agents interact in real-time"
echo "   4. Use the pause button to provide guidance"
echo "   5. Review conversation analytics when finished"
echo ""
echo "🛠️  Troubleshooting:"
echo "   • If you see API errors, visit: http://localhost:3001/test-api.html"
echo "   • Backend logs are visible in this terminal"
echo "   • Press Ctrl+C to stop all servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT

# Keep running
wait