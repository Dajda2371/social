@echo off
cd frontend
call npm install
call npx expo start --lan --port 8081
pause
