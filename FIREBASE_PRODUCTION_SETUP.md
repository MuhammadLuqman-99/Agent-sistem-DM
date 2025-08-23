# 🔥 Firebase Production Setup untuk AgentOS

## 📋 Overview
Setup Firebase production environment untuk enable full database features di AgentOS system anda.

## 🎯 Benefits After Setup
- ✅ Real-time agent data storage
- ✅ Commission history tracking  
- ✅ Order assignment persistence
- ✅ User authentication
- ✅ Analytics & reporting
- ✅ Data backup & security

---

## 🚀 Step 1: Firebase Project Setup

### 1.1 Go to Firebase Console
```
https://console.firebase.google.com/
```

### 1.2 Create New Project (or use existing)
- Project Name: `agentos-kilang-batik` 
- Enable Google Analytics: **Yes**
- Analytics Account: Choose your account

### 1.3 Enable Required Services
**Firestore Database:**
- Go to `Firestore Database`
- Click `Create database`
- Start in `production mode`
- Choose location: `asia-southeast1` (Singapore)

**Authentication:**
- Go to `Authentication`
- Click `Get started` 
- Enable `Email/Password` provider

---

## 🔧 Step 2: Service Account Creation

### 2.1 Generate Service Account Key
1. Go to `Project Settings` → `Service accounts`
2. Click `Generate new private key`
3. Save as `firebase-service-account.json`

### 2.2 Place Service Account File
```bash
# Create config directory
mkdir C:\Users\PC CUSTOM\Desktop\Coding\deepseek\config

# Move your downloaded file to:
C:\Users\PC CUSTOM\Desktop\Coding\deepseek\config\firebase-service-account.json
```

---

## ⚙️ Step 3: Update Environment Configuration

Update your `.env` file:

```env
# Firebase Configuration - PRODUCTION
FIREBASE_SERVICE_ACCOUNT_PATH=../config/firebase-service-account.json

# Optional: If you prefer environment variable instead of file
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}

# Firebase Project Settings
FIREBASE_PROJECT_ID=agentos-kilang-batik
FIREBASE_DATABASE_URL=https://agentos-kilang-batik-default-rtdb.asia-southeast1.firebasedatabase.app/
```

---

## 📊 Step 4: Database Structure Setup

Your AgentOS will create these collections automatically:

### 4.1 Collections Structure
```
users/
├── {agentId}/
│   ├── name: string
│   ├── email: string  
│   ├── role: "agent" | "admin"
│   ├── territory: string
│   ├── commissionRate: number
│   ├── phone: string
│   ├── status: "active" | "inactive"
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp

shopify-orders/
├── {orderId}/
│   ├── orderNumber: string
│   ├── customerName: string
│   ├── total: number
│   ├── currency: string
│   ├── assignedAgent: string
│   ├── commissionCalculated: boolean
│   ├── status: string
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp

commission-calculations/
├── {commissionId}/
│   ├── orderId: string
│   ├── agentId: string
│   ├── orderTotal: number
│   ├── totalCommission: number
│   ├── commissionBreakdown: object
│   ├── status: "pending" | "paid"
│   ├── calculatedAt: timestamp
│   └── payoutDate: timestamp

sync-logs/
├── {logId}/
│   ├── operation: string
│   ├── status: "success" | "failed"
│   ├── details: object
│   ├── error: string
│   └── timestamp: timestamp
```

### 4.2 Security Rules
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - agents can read own data, admins can read all
    match /users/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Orders - agents can see assigned orders, admins see all
    match /shopify-orders/{orderId} {
      allow read: if request.auth != null && 
        (resource.data.assignedAgent == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Commissions - agents can see own commissions, admins see all  
    match /commission-calculations/{commissionId} {
      allow read: if request.auth != null && 
        (resource.data.agentId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Sync logs - admin only
    match /sync-logs/{logId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 🧪 Step 5: Test Firebase Connection

### 5.1 Test API Connection
```bash
# Test Firebase health
curl http://localhost:3002/api/agents/health

# Expected response:
{"success": true, "status": "healthy", "firebase": "connected"}
```

### 5.2 Create Test Agent
```bash
curl -X POST http://localhost:3002/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmad Test Agent",
    "email": "ahmad@kilangbatik.com", 
    "territory": "KL-Selangor",
    "commissionRate": 5.5,
    "phone": "+60123456789"
  }'
```

### 5.3 Test Commission with Real Data
```bash
curl -X POST http://localhost:3002/api/commission/simulate \
  -H "Content-Type: application/json" \
  -d '{"agentId": "your-test-agent-id"}'
```

---

## 🌐 Step 6: Frontend Firebase Integration

Update your frontend to use Firebase Auth:

### 6.1 Add Firebase Config to Frontend
```javascript
// assets/js/firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "agentos-kilang-batik.firebaseapp.com",
  projectId: "agentos-kilang-batik", 
  storageBucket: "agentos-kilang-batik.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

## 🔒 Step 7: Security & Production Checklist

### 7.1 Security Checklist
- [ ] Service account file secured (not in git)
- [ ] Firestore security rules configured
- [ ] Environment variables set properly  
- [ ] API rate limiting enabled
- [ ] HTTPS enabled (for production deployment)
- [ ] CORS configured for your domain only

### 7.2 Monitoring Setup
- [ ] Firebase Console monitoring enabled
- [ ] Error logging configured
- [ ] Performance monitoring setup
- [ ] Backup strategy implemented

---

## 🚨 Important Security Notes

### 🔐 Service Account Security
```bash
# NEVER commit this file to git
echo "config/firebase-service-account.json" >> .gitignore

# Set proper file permissions
chmod 600 config/firebase-service-account.json
```

### 🌍 CORS Configuration
```javascript
// Update server.js CORS settings for production
const corsOptions = {
  origin: [
    'https://your-domain.com',
    'https://admin.your-domain.com',
    'http://localhost:5500'  // Remove in production
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

---

## ✅ Step 8: Verification Steps

After setup, verify these work:

1. **Firebase Connection**: Green status in feature check
2. **Agent Creation**: New agents saved to Firestore  
3. **Order Assignment**: Orders properly assigned and stored
4. **Commission Calculation**: Commissions saved with full breakdown
5. **Real-time Updates**: Changes reflect immediately
6. **Error Handling**: Proper error messages and logging

---

## 🆘 Troubleshooting

### Common Issues:

**"Firebase not initialized"**
- Check service account file path
- Verify project ID matches
- Ensure proper permissions

**"Permission denied"**  
- Check Firestore security rules
- Verify user authentication
- Update collection permissions

**"Network error"**
- Check internet connection
- Verify Firebase project is active
- Check API quotas

---

## 🎯 Next Steps After Firebase Setup

1. **Deploy to Production**: Use Railway, Render, or Vercel
2. **Domain Setup**: Configure custom domain
3. **SSL Certificate**: Enable HTTPS
4. **Monitoring**: Setup alerts and logging  
5. **Backup**: Configure automated backups

---

## 📞 Need Help?

If you encounter issues:
1. Check Firebase Console for error logs
2. Review Firestore security rules  
3. Verify service account permissions
4. Test API endpoints individually

**Firebase Production Setup = Full Database Power untuk AgentOS! 🚀**