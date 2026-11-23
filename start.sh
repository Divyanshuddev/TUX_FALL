#!/usr/bin/env bash
# TuxFall - Complete Stack Launcher (FastAPI Backend + Next.js Frontend)

echo "🐧 Starting Tux Fall: Linux Architecture Skyfall Game..."

# Ensure we're in the project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Start FastAPI Backend
echo "⚡ Launching FastAPI Backend on http://0.0.0.0:8000..."
cd "$SCRIPT_DIR/backend"
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 2. Start Next.js Frontend
echo "❄️ Launching Next.js Frontend on http://localhost:3000..."
cd "$SCRIPT_DIR/frontend"
npm start &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo "🎮 TUX FALL IS LIVE & READY TO PLAY!"
echo "👉 Open Frontend in browser: http://localhost:3000"
echo "📡 Backend API Docs:        http://localhost:8000/docs"
echo "=========================================================="
echo "Press Ctrl+C to terminate both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT INT TERM
wait
