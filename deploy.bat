@echo off
echo.
echo 🚀 Deploying Kilang Desa Murni Batik Enterprise System to Firebase...
echo.

REM Check if Firebase CLI is available
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Firebase CLI not found! Please install it first:
    echo npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

echo ✅ Firebase CLI detected
echo.

REM Show current Firebase project
echo 📋 Current Firebase project:
firebase use
echo.

REM Confirm deployment
set /p confirm="Deploy to production? (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ Deployment cancelled
    pause
    exit /b 0
)

echo.
echo 🔥 Starting deployment...
echo.

REM Deploy to Firebase Hosting
firebase deploy --only hosting -m "Enterprise Frontend v2.0 - User-Friendly System 🚀"

if errorlevel 1 (
    echo.
    echo ❌ Deployment failed! Check the error messages above.
    echo.
    echo 🔧 Common fixes:
    echo - Make sure you're logged in: firebase login
    echo - Check project selection: firebase use --add
    echo - Verify firebase.json configuration
    echo.
    pause
    exit /b 1
)

echo.
echo 🎉 Deployment successful!
echo.
echo 🌐 Your enterprise system is now live at:
echo https://your-project-id.web.app
echo.
echo 📱 Test these URLs:
echo ├── Admin Dashboard: https://your-project-id.web.app/admin
echo ├── Agent Dashboard: https://your-project-id.web.app/agent  
echo ├── Login Page: https://your-project-id.web.app/login
echo └── Main Landing: https://your-project-id.web.app/
echo.
echo ✅ Features now live:
echo ├── 🎯 Modern Enterprise Design
echo ├── 📱 Mobile-First Interface
echo ├── ♿ Full Accessibility Support
echo ├── ⚡ Lightning Fast Performance
echo ├── 🛡️ Enterprise Security Headers
echo └── 👥 User-Friendly for Everyone
echo.
echo 🎊 Your Kilang Desa Murni Batik system is now enterprise-level!
echo.
pause