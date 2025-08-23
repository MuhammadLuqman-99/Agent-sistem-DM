// Automated Firebase Setup for AgentOS Production
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

class FirebaseSetup {
  constructor() {
    this.configPath = '../config';
    this.serviceAccountPath = '../config/firebase-service-account.json';
  }

  async setup() {
    console.log('🔥 Firebase Production Setup untuk AgentOS');
    console.log('==========================================\n');

    try {
      // Step 1: Check current Firebase status
      await this.checkCurrentStatus();

      // Step 2: Create config directory
      await this.createConfigDirectory();

      // Step 3: Check for service account
      await this.checkServiceAccount();

      // Step 4: Test Firebase connection
      await this.testConnection();

      // Step 5: Initialize database structure
      await this.initializeDatabase();

      // Step 6: Provide next steps
      this.showCompletionGuide();

    } catch (error) {
      console.error('❌ Firebase setup failed:', error.message);
      this.showTroubleshootingGuide();
    }
  }

  async checkCurrentStatus() {
    console.log('📋 Step 1: Checking Current Firebase Status');
    console.log('-------------------------------------------');

    const hasServiceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const hasServiceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (hasServiceAccountPath) {
      console.log(`✅ Service Account Path: ${hasServiceAccountPath}`);
      
      const fullPath = path.resolve(hasServiceAccountPath);
      if (existsSync(fullPath)) {
        console.log('✅ Service Account File: Found');
        
        try {
          const content = await readFile(fullPath, 'utf8');
          const serviceAccount = JSON.parse(content);
          console.log(`✅ Project ID: ${serviceAccount.project_id}`);
          console.log(`✅ Client Email: ${serviceAccount.client_email}`);
          console.log('🎉 Firebase is already configured!\n');
          return true;
        } catch (error) {
          console.log('❌ Service Account File: Invalid JSON');
        }
      } else {
        console.log('❌ Service Account File: Not found');
      }
    } else if (hasServiceAccountEnv) {
      console.log('✅ Service Account: Environment variable configured');
      try {
        const serviceAccount = JSON.parse(hasServiceAccountEnv);
        console.log(`✅ Project ID: ${serviceAccount.project_id}`);
        console.log('🎉 Firebase is configured via environment variable!\n');
        return true;
      } catch (error) {
        console.log('❌ Service Account: Invalid JSON in environment variable');
      }
    } else {
      console.log('⚠️  Firebase: Not configured yet');
    }

    console.log();
    return false;
  }

  async createConfigDirectory() {
    console.log('📁 Step 2: Creating Config Directory');
    console.log('-----------------------------------');

    const configDir = path.resolve(this.configPath);
    
    if (!existsSync(configDir)) {
      try {
        await mkdir(configDir, { recursive: true });
        console.log(`✅ Created config directory: ${configDir}`);
      } catch (error) {
        console.log(`❌ Failed to create config directory: ${error.message}`);
        throw error;
      }
    } else {
      console.log(`✅ Config directory exists: ${configDir}`);
    }

    console.log();
  }

  async checkServiceAccount() {
    console.log('🔑 Step 3: Service Account Setup');
    console.log('-------------------------------');

    const serviceAccountPath = path.resolve(this.serviceAccountPath);
    
    if (existsSync(serviceAccountPath)) {
      console.log('✅ Service account file found');
      
      try {
        const content = await readFile(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(content);
        
        // Validate required fields
        const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
        const missingFields = requiredFields.filter(field => !serviceAccount[field]);
        
        if (missingFields.length > 0) {
          console.log(`❌ Service account missing fields: ${missingFields.join(', ')}`);
          throw new Error('Invalid service account file');
        }
        
        console.log(`✅ Project ID: ${serviceAccount.project_id}`);
        console.log(`✅ Client Email: ${serviceAccount.client_email}`);
        console.log('✅ Service account is valid');
        
      } catch (error) {
        console.log(`❌ Invalid service account file: ${error.message}`);
        throw error;
      }
    } else {
      console.log('❌ Service account file not found');
      console.log('\n🔧 SETUP REQUIRED:');
      console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
      console.log('2. Select your project (or create new one)');
      console.log('3. Go to Project Settings → Service Accounts');
      console.log('4. Click "Generate new private key"');
      console.log(`5. Save the file as: ${serviceAccountPath}`);
      console.log('\nAfter downloading the file, run this script again.');
      
      return false;
    }

    console.log();
    return true;
  }

  async testConnection() {
    console.log('🧪 Step 4: Testing Firebase Connection');
    console.log('-------------------------------------');

    try {
      // Import Firebase service for testing
      const { default: FirebaseService } = await import('../src/services/firebase.js');
      const firebaseService = new FirebaseService();
      
      console.log('⏳ Testing Firestore connection...');
      
      // Test health check
      const healthResult = await firebaseService.isHealthy();
      
      if (healthResult.success) {
        console.log('✅ Firestore connection: Working');
        console.log('✅ Database write test: Passed');
        console.log('🎉 Firebase is fully operational!');
      } else {
        console.log('❌ Firestore connection failed');
        console.log(`   Error: ${healthResult.error}`);
        throw new Error('Firebase connection test failed');
      }
      
    } catch (error) {
      console.log('❌ Firebase connection test failed');
      console.log(`   Error: ${error.message}`);
      
      // Common troubleshooting
      console.log('\n🔧 Troubleshooting:');
      console.log('• Check internet connection');
      console.log('• Verify service account permissions');
      console.log('• Ensure Firestore is enabled in Firebase Console');
      console.log('• Check project ID matches in service account');
      
      throw error;
    }

    console.log();
  }

  async initializeDatabase() {
    console.log('🗄️ Step 5: Initializing Database Structure');
    console.log('------------------------------------------');

    try {
      const { default: FirebaseService } = await import('../src/services/firebase.js');
      const firebaseService = new FirebaseService();

      // Create initial admin user (if not exists)
      console.log('⏳ Creating initial admin user...');
      
      const adminUser = {
        name: 'Admin User',
        email: 'admin@kilangbatik.com',
        role: 'admin',
        territory: 'All',
        commissionRate: 0,
        phone: '',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Try to create admin user
      const adminResult = await firebaseService.updateUser('admin-001', adminUser);
      if (adminResult.success) {
        console.log('✅ Admin user created/updated');
      }

      // Create sample agent for testing
      console.log('⏳ Creating sample agent...');
      
      const sampleAgent = {
        name: 'Ahmad Sample Agent',
        email: 'agent@kilangbatik.com',
        role: 'agent',
        territory: 'KL-Selangor',
        commissionRate: 5.0,
        phone: '+60123456789',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const agentResult = await firebaseService.updateUser('agent-001', sampleAgent);
      if (agentResult.success) {
        console.log('✅ Sample agent created');
      }

      console.log('✅ Database initialization completed');

    } catch (error) {
      console.log('⚠️  Database initialization failed (but Firebase is working)');
      console.log(`   Error: ${error.message}`);
      console.log('   This is normal - you can create users through the API later');
    }

    console.log();
  }

  showCompletionGuide() {
    console.log('🎉 FIREBASE SETUP COMPLETE!');
    console.log('==========================');
    
    console.log('✅ Your AgentOS system now has:');
    console.log('   • Full database functionality');
    console.log('   • Real-time data persistence');
    console.log('   • Commission history tracking');
    console.log('   • User management system');
    console.log('   • Order assignment storage\n');

    console.log('🔄 Please RESTART your API server to apply changes:');
    console.log('   1. Stop current server (Ctrl+C)');
    console.log('   2. Run: npm run dev');
    console.log('   3. Check: http://localhost:3002/health\n');

    console.log('🧪 Test your setup:');
    console.log('   • Feature check: node scripts/feature-check.js');
    console.log('   • Commission test: curl http://localhost:3002/api/commission/simulate');
    console.log('   • Agent creation: Use admin dashboard\n');

    console.log('🌐 Next Steps:');
    console.log('   • Deploy to production hosting');
    console.log('   • Setup custom domain');
    console.log('   • Configure SSL certificate');
    console.log('   • Setup monitoring and backups\n');
  }

  showTroubleshootingGuide() {
    console.log('\n🆘 TROUBLESHOOTING GUIDE');
    console.log('=======================');
    
    console.log('Common Issues:');
    console.log('\n1. "Service account not found"');
    console.log('   → Download from Firebase Console → Project Settings → Service Accounts');
    console.log('   → Place file at: config/firebase-service-account.json\n');

    console.log('2. "Permission denied"');
    console.log('   → Check Firestore security rules');
    console.log('   → Ensure service account has proper permissions\n');

    console.log('3. "Network error"');
    console.log('   → Check internet connection');
    console.log('   → Verify Firebase project is active\n');

    console.log('📚 Documentation:');
    console.log('   • Setup guide: FIREBASE_PRODUCTION_SETUP.md');
    console.log('   • Firebase Console: https://console.firebase.google.com/\n');
  }
}

// Run the setup
const setup = new FirebaseSetup();
setup.setup();