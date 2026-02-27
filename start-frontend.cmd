@echo off
cd frontend
call npm install
call npx expo start --lan --web --port 8081
pause
