@echo off
echo Checking for processes on port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Killing process %%a
    taskkill //PID %%a //F
)
echo Port 3001 is now free
pause