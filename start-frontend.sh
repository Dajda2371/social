#!/bin/bash
set -e

# Kill any process already using port 8081
PID=$(lsof -ti :8081)
if [ -n "$PID" ]; then
    echo "Killing process on port 8081 (PID: $PID)..."
    kill -9 $PID
    sleep 1
fi

cd frontend || exit 1
npm install
npm start
