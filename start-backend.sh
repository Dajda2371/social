#!/bin/bash

# Kill any process already using port 8000
PID=$(lsof -ti :8000 2>/dev/null || true)
if [ -n "$PID" ]; then
    echo "Killing process on port 8000 (PID: $PID)..."
    kill -9 $PID
    sleep 1
fi

cd backend || exit 1
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0
