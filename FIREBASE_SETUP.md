# Firebase Setup Instructions

## Langkah-langkah Setup Firebase untuk AgentOS

### 1. Buat Firebase Project

1. Pergi ke [Firebase Console](https://console.firebase.google.com/)
2. Klik "Create a project" atau "Add project"
3. Masukkan nama project: **desamunibatik-agentos**
4. Enable Google Analytics (optional)
5. Pilih Analytics account atau buat baru
6. Klik "Create project"

### 2. Setup Authentication

1. Di Firebase Console, pilih project anda
2. Klik "Authentication" di sidebar
3. Klik "Get started"
4. Pilih tab "Sign-in method"
5. Enable "Email/Password" provider:
   - Klik "Email/Password"
   - Toggle "Enable"
   - Klik "Save"

### 3. Setup Firestore Database

1. Klik "Firestore Database" di sidebar
2. Klik "Create database"
3. Pilih "Start in test mode" (untuk development)
4. Pilih location (asia-southeast1 untuk Malaysia)
5. Klik "Done"

### 4. Setup Storage

1. Klik "Storage" di sidebar
2. Klik "Get started"
3. Review security rules (gunakan default untuk development)
4. Pilih location yang sama dengan Firestore
5. Klik "Done"

### 5. Get Firebase Configuration

1. Klik gear icon ⚙️ di sidebar
2. Pilih "Project settings"
3. Scroll ke bawah ke "Your apps"
4. Klik "Add app" dan pilih web icon (<//>)
5. Register app dengan nama "AgentOS Web"
6. Copy configuration object

### 6. Update Firebase Config Files

Gantikan configuration di file-file berikut dengan config dari Firebase Console:

#### File: `config/firebase-config.js`
```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "desamunibatik-agentos.firebaseapp.com",
    projectId: "desamunibatik-agentos",
    storageBucket: "desamunibatik-agentos.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

#### File: `pages/firebase-login.html`
```javascript
const firebaseConfig = {
    // Same config as above
};
```

### 7. Setup Firestore Security Rules

Dalam Firestore Database, klik "Rules" tab dan gantikan dengan rules berikut:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && resource.data.role == 'admin';
    }
    
    // Sales data - agents can only access their own sales
    match /sales/{saleId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.agentId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
    }
    
    // Returns data - agents can only access their own returns
    match /returns/{returnId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.agentId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
    }
    
    // Admin can read all data
    match /{document=**} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 8. Setup Storage Security Rules

Dalam Storage, klik "Rules" tab:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile photos - users can only upload to their own folder
    match /profile-photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin can access all files
    match /{allPaths=**} {
      allow read, write: if request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 9. Test Demo Accounts

Sistem akan automatically create demo accounts pertama kali dijalankan:

**Admin Account:**
- Email: `admin@desamunibatik.com`
- Password: `Admin123!`

**Agent Account:**
- Email: `ahmad.rahman@desamunibatik.com`
- Password: `Agent123!`

### 10. Update HTML Files untuk Firebase

#### Agent Dashboard
```html
<!-- Add before closing </body> tag in agent-dashboard.html -->
<script type="module" src="../assets/js/firebase-agent.js"></script>
```

#### Login Pages
- Gunakan `firebase-login.html` untuk Firebase authentication
- `login.html` tetap available untuk simple access

#### Logout Pages
```html
<!-- Update logout.html to use Firebase logout -->
<script type="module" src="../assets/js/firebase-logout.js"></script>
```

### 11. File Structure setelah Firebase Setup

```
deepseek/
├── config/
│   └── firebase-config.js          ✅ Firebase configuration
├── services/
│   ├── firebase-service.js         ✅ Firebase service functions  
│   └── migration-service.js        ✅ Data migration utilities
├── assets/js/
│   ├── firebase-agent.js           ✅ Agent Firebase integration
│   └── firebase-logout.js          ✅ Firebase logout handler
├── pages/
│   ├── firebase-login.html         ✅ Firebase auth login page
│   ├── login.html                  ✅ Simple login (unchanged)
│   ├── agent-dashboard.html        📝 Update dengan Firebase script
│   └── admin-dashboard.html        📝 Update dengan Firebase script
└── FIREBASE_SETUP.md              📋 Setup instructions
```

### 12. Testing Firebase Integration

1. Open `pages/firebase-login.html` in browser
2. Login dengan demo account (admin atau agent)
3. Verify redirect ke appropriate dashboard
4. Test profile updates
5. Test photo upload
6. Test logout functionality

### 13. Enable Firebase Hosting (Optional)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### 14. Production Considerations

1. **Security Rules**: Update rules untuk production environment
2. **API Quotas**: Monitor Firebase usage
3. **Backup**: Setup automated backups
4. **Domain**: Configure custom domain jika diperlukan
5. **Analytics**: Setup proper analytics tracking

### 15. Troubleshooting

**Common Issues:**

1. **CORS Errors**: Pastikan domain authorized dalam Firebase Console
2. **Permission Denied**: Check Firestore security rules
3. **File Upload Fails**: Check Storage security rules  
4. **Login Redirect Fails**: Verify Firebase config dan auth domain

**Debug Mode:**
- Open browser developer tools
- Check Console untuk error messages
- Monitor Network tab untuk failed requests
- Check Firebase Console untuk authentication logs

## Data Migration

Sistem akan automatically migrate existing localStorage data ke Firebase pada first login. Migration includes:

- User profiles (agent/admin)
- Sales records
- Returns data  
- Photo uploads
- Settings dan preferences

## Support

Untuk troubleshooting atau questions:
1. Check browser developer console
2. Review Firebase Console logs
3. Verify configuration settings
4. Test dengan demo accounts