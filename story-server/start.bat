@echo off
REM DeepShare Story Protocol Server Startup Script for Windows

echo Starting DeepShare Story Protocol Server...

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
)

REM Check if .env exists
if not exist ".env" (
    echo Warning: .env file not found
    echo Creating from example...
    copy .env.example .env
)

REM Start the server
echo Starting server on port 3003...
npm start

