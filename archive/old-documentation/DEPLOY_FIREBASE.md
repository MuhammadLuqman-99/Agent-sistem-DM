# 🚀 Deploy AgentOS ke Firebase Hosting

## Step-by-Step Deployment

### 1. Install Firebase CLI
```bash
# Install Firebase tools globally
npm install -g firebase-tools

# Login ke Firebase account
firebase login
```

### 2. Initialize Firebase Project
```bash
# Navigate ke project folder
cd C:\Users\PC CUSTOM\Desktop\Coding\deepseek

# Initialize Firebase (sudah siap, skip jika file firebase.json wujud)
firebase init hosting
```

### 3. Deploy ke Firebase Hosting
```bash
# Deploy website ke Firebase
firebase deploy

# Atau deploy hosting saja
firebase deploy --only hosting
```

### 4. Setup Firebase Services (Required)

**Enable Authentication:**
```
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: admin-agent-teamsale
3. Authentication → Get started → Email/Password → Enable
```

**Enable Firestore:**
```
1. Firestore Database → Create database → Test mode
2. Location: asia-southeast1 (Singapore)
```

**Enable Storage:**
```
1. Storage → Get started → Default rules
2. Same location: asia-southeast1
```

## Quick Deploy Commands

### Development Deploy
```bash
# Serve locally for testing
firebase serve

# Deploy ke Firebase
firebase deploy
```

### Production Deploy  
```bash
# Deploy dengan custom message
firebase deploy -m "AgentOS v1.0 - Firebase Integration Complete"

# Deploy dan open website
firebase deploy && firebase open hosting:site
```

## Expected URLs After Deploy

### Main Website
```
Primary: https://admin-agent-teamsale.web.app
Secondary: https://admin-agent-teamsale.firebaseapp.com
```

### Direct Access URLs
```
Homepage: https://admin-agent-teamsale.web.app/
Firebase Login: https://admin-agent-teamsale.web.app/login
Admin Dashboard: https://admin-agent-teamsale.web.app/admin  
Agent Dashboard: https://admin-agent-teamsale.web.app/agent
```

## Demo Accounts untuk Testing

**Admin Account:**
- Email: `admin@admin-agent-teamsale.com`
- Password: `Admin123!`

**Agent Account:**
- Email: `agent@admin-agent-teamsale.com`
- Password: `Agent123!`

## File Structure Ready untuk Deploy

```
✅ firebase.json           # Hosting configuration
✅ .firebaserc             # Project configuration  
✅ package.json            # NPM scripts
✅ index.html              # Updated homepage
✅ pages/                  # All pages ready
✅ assets/                 # CSS/JS/Images
✅ config/firebase-config.js # Firebase config
✅ services/               # Firebase services
```

## Deployment Features

### Automatic Redirects
```
/ → index.html
/admin → pages/admin-dashboard.html
/agent → pages/agent-dashboard.html
/login → pages/firebase-login.html
```

### Performance Optimizations
- Static file caching (1 year)
- Gzip compression
- CDN distribution

### Security
- HTTPS enforced
- Firebase security rules
- Authentication required

## Post-Deploy Testing

### 1. Test Homepage
```
Visit: https://admin-agent-teamsale.web.app/
Should show: Updated homepage dengan Firebase login options
```

### 2. Test Firebase Login
```
Visit: https://admin-agent-teamsale.web.app/login
Login dengan demo accounts
Should redirect to appropriate dashboard
```

### 3. Test Dashboards  
```
Admin: https://admin-agent-teamsale.web.app/admin
Agent: https://admin-agent-teamsale.web.app/agent
Should load with Firebase integration
```

### 4. Test Profile Management
```
Upload profile photo
Update profile information  
Should sync dengan Firebase
```

## Monitoring & Analytics

### Firebase Console Monitoring
```
Hosting: View deployment status
Authentication: Monitor user logins
Firestore: Check database usage
Storage: Monitor file uploads
```

### Performance
```
Hosting Metrics: Page views, data transfer
Authentication Metrics: Active users
Database Metrics: Read/write operations
```

## Troubleshooting

### Common Issues:

**1. Deploy Fails:**
```bash
# Check Firebase login
firebase login --reauth

# Check project setup
firebase projects:list
```

**2. Website Not Loading:**
```
- Check Firebase Hosting enabled
- Verify firebase.json configuration
- Check browser cache (hard refresh)
```

**3. Firebase Login Fails:**
```
- Verify Firebase services enabled
- Check demo accounts created
- Review browser console errors
```

**4. CORS Errors:**
```
- Verify domain dalam Firebase console
- Check authentication domain settings
```

## NPM Scripts Available

```bash
# Local development
npm start              # firebase serve

# Deploy  
npm run deploy         # firebase deploy
npm run deploy:hosting # firebase deploy --only hosting
```

## Custom Domain (Optional)

```bash
# Add custom domain
firebase hosting:channel:deploy preview --expires 7d
firebase hosting:sites:create your-domain-com
```

## Backup & Rollback

```bash
# View deployment history
firebase hosting:releases:list

# Rollback to previous version
firebase hosting:rollback
```

---

## Ready to Deploy! 🚀

All files configured dan ready untuk deploy ke Firebase Hosting dengan single command:

```bash
firebase deploy
```

Website akan available di: `https://admin-agent-teamsale.web.app/`