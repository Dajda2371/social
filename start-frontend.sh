#!/bin/bash

# Kill any process already using port 8081
PID=$(lsof -ti :8081 2>/dev/null || true)
if [ -n "$PID" ]; then
    echo "Killing process on port 8081 (PID: $PID)..."
    kill -9 $PID
    sleep 1
fi

cd frontend || exit 1
npm install
npx expo start --lan --web --port 8081
