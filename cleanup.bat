@echo off
echo 🧹 Cleaning up Kilang Desa Murni Batik Project...
echo.

REM Create backup folder first
if not exist "archive" mkdir archive
if not exist "archive\old-documentation" mkdir archive\old-documentation
if not exist "archive\old-frontend" mkdir archive\old-frontend

echo ✅ Created archive folders

REM Move old documentation files
echo.
echo 📄 Archiving old documentation...
if exist "DEPLOY_FIREBASE.md" move "DEPLOY_FIREBASE.md" "archive\old-documentation\"
if exist "FIREBASE_PRODUCTION_SETUP.md" move "FIREBASE_PRODUCTION_SETUP.md" "archive\old-documentation\"
if exist "FIREBASE_SETUP.md" move "FIREBASE_SETUP.md" "archive\old-documentation\"
if exist "PHASE1_IMPLEMENTATION.md" move "PHASE1_IMPLEMENTATION.md" "archive\old-documentation\"
if exist "PRODUCTION_DEPLOYMENT.md" move "PRODUCTION_DEPLOYMENT.md" "archive\old-documentation\"
if exist "QUICK_START_FIREBASE.md" move "QUICK_START_FIREBASE.md" "archive\old-documentation\"
if exist "README_FIREBASE.md" move "README_FIREBASE.md" "archive\old-documentation\"
if exist "SHOPIFY_INTEGRATION_ROADMAP.md" move "SHOPIFY_INTEGRATION_ROADMAP.md" "archive\old-documentation\"
if exist "SYSTEM_COMPLETE_REPORT.md" move "SYSTEM_COMPLETE_REPORT.md" "archive\old-documentation\"
if exist "TECHNICAL_ARCHITECTURE.md" move "TECHNICAL_ARCHITECTURE.md" "archive\old-documentation\"

REM Archive old frontend files
echo.
echo 🎨 Archiving old frontend files...
if exist "pages\admin-dashboard.html" move "pages\admin-dashboard.html" "archive\old-frontend\"
if exist "pages\agent-dashboard.html" move "pages\agent-dashboard.html" "archive\old-frontend\"

REM Archive old admin pages
if exist "pages\admin" (
    echo Moving old admin pages...
    move "pages\admin" "archive\old-frontend\admin"
)

REM Archive old agent pages  
if exist "pages\agent" (
    echo Moving old agent pages...
    move "pages\agent" "archive\old-frontend\agent"
)

REM Archive old CSS files
echo.
echo 💅 Archiving old CSS files...
if exist "assets\css\admin-styles.css" move "assets\css\admin-styles.css" "archive\old-frontend\"
if exist "assets\css\agent-styles.css" move "assets\css\agent-styles.css" "archive\old-frontend\"
if exist "assets\css\change-password-styles.css" move "assets\css\change-password-styles.css" "archive\old-frontend\"
if exist "assets\css\logout-styles.css" move "assets\css\logout-styles.css" "archive\old-frontend\"
if exist "assets\css\profile-styles.css" move "assets\css\profile-styles.css" "archive\old-frontend\"
if exist "assets\css\sales-list-styles.css" move "assets\css\sales-list-styles.css" "archive\old-frontend\"

REM Archive old JS files
echo.
echo ⚡ Archiving old JavaScript files...
if exist "assets\js\admin-script.js" move "assets\js\admin-script.js" "archive\old-frontend\"
if exist "assets\js\agent-script.js" move "assets\js\agent-script.js" "archive\old-frontend\"
if exist "assets\js\auth-script.js" move "assets\js\auth-script.js" "archive\old-frontend\"
if exist "assets\js\change-password-script.js" move "assets\js\change-password-script.js" "archive\old-frontend\"
if exist "assets\js\firebase-logout.js" move "assets\js\firebase-logout.js" "archive\old-frontend\"
if exist "assets\js\logout-script.js" move "assets\js\logout-script.js" "archive\old-frontend\"
if exist "assets\js\profile-script.js" move "assets\js\profile-script.js" "archive\old-frontend\"
if exist "assets\js\sales-list-script.js" move "assets\js\sales-list-script.js" "archive\old-frontend\"

echo.
echo 🎉 Cleanup Complete!
echo.
echo ✅ Your project is now clean and organized:
echo    - Old files moved to 'archive' folder
echo    - Only enterprise files remain in main project
echo    - Ready for production deployment!
echo.
echo 📁 Current structure:
echo    ├── index.html (NEW Enterprise Landing)
echo    ├── pages\enterprise-admin-dashboard.html (NEW)
echo    ├── pages\enterprise-agent-dashboard.html (NEW)
echo    ├── assets\css\enterprise-core.css (NEW)
echo    ├── assets\css\accessibility.css (NEW)
echo    ├── assets\js\enterprise-ui.js (NEW)
echo    └── api\ (Backend - unchanged)
echo.
pause