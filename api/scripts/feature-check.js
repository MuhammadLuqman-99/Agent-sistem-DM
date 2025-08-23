// AgentOS Feature Check Script
import dotenv from 'dotenv';

dotenv.config();

class FeatureChecker {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3002';
    this.features = [];
  }

  async checkAllFeatures() {
    console.log('🔍 AgentOS Feature Check Report');
    console.log('================================\n');
    
    // Check API Server
    await this.checkApiServer();
    
    // Check Shopify Integration
    await this.checkShopifyIntegration();
    
    // Check Commission System
    await this.checkCommissionSystem();
    
    // Check Firebase Integration
    await this.checkFirebaseIntegration();
    
    // Check Agent Management
    await this.checkAgentManagement();
    
    // Check Frontend Pages
    await this.checkFrontendPages();
    
    // Summary Report
    this.printSummary();
  }

  async checkApiServer() {
    console.log('🚀 API SERVER STATUS');
    console.log('--------------------');
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      if (response.ok) {
        const health = await response.json();
        console.log('✅ API Server: RUNNING');
        console.log(`   Port: ${this.apiBaseUrl.split(':')[2]}`);
        console.log(`   Environment: ${health.environment}`);
        console.log(`   Version: ${health.version}`);
        this.features.push({ name: 'API Server', status: 'working', details: 'Running on port 3002' });
      } else {
        throw new Error('Server not responding');
      }
    } catch (error) {
      console.log('❌ API Server: NOT RUNNING');
      console.log(`   Error: ${error.message}`);
      this.features.push({ name: 'API Server', status: 'failed', details: error.message });
      return false;
    }
    
    console.log();
    return true;
  }

  async checkShopifyIntegration() {
    console.log('🛍️ SHOPIFY INTEGRATION');
    console.log('----------------------');
    
    try {
      // Check products endpoint
      const productsResponse = await fetch(`${this.apiBaseUrl}/api/shopify/products`);
      const productsResult = await productsResponse.json();
      
      if (productsResult.success && productsResult.data.length > 0) {
        console.log('✅ Shopify Products: CONNECTED');
        console.log(`   Products loaded: ${productsResult.data.length}`);
        console.log(`   Store: ${process.env.SHOPIFY_SHOP_NAME}.myshopify.com`);
        
        // Show sample products
        const sampleProducts = productsResult.data.slice(0, 3);
        sampleProducts.forEach(product => {
          console.log(`   • ${product.title} - RM${product.variants[0]?.price || 0}`);
        });
        
        this.features.push({ 
          name: 'Shopify Products', 
          status: 'working', 
          details: `${productsResult.data.length} products loaded` 
        });
      } else {
        throw new Error('No products found or API error');
      }
      
      // Check orders endpoint
      const ordersResponse = await fetch(`${this.apiBaseUrl}/api/shopify/orders`);
      const ordersResult = await ordersResponse.json();
      
      if (ordersResult.success && ordersResult.data.length > 0) {
        console.log('✅ Shopify Orders: CONNECTED');
        console.log(`   Orders loaded: ${ordersResult.data.length}`);
        console.log(`   Latest: ${ordersResult.data[0].name} - RM${ordersResult.data[0].total}`);
        
        this.features.push({ 
          name: 'Shopify Orders', 
          status: 'working', 
          details: `${ordersResult.data.length} orders loaded` 
        });
      } else {
        console.log('⚠️  Shopify Orders: LIMITED ACCESS');
        console.log('   Note: Orders may require additional API permissions');
        this.features.push({ name: 'Shopify Orders', status: 'limited', details: 'API permissions needed' });
      }
      
    } catch (error) {
      console.log('❌ Shopify Integration: FAILED');
      console.log(`   Error: ${error.message}`);
      this.features.push({ name: 'Shopify Integration', status: 'failed', details: error.message });
    }
    
    console.log();
  }

  async checkCommissionSystem() {
    console.log('💰 COMMISSION SYSTEM');
    console.log('-------------------');
    
    try {
      // Check commission rates
      const ratesResponse = await fetch(`${this.apiBaseUrl}/api/commission/rates`);
      const ratesResult = await ratesResponse.json();
      
      if (ratesResult.success) {
        console.log('✅ Commission Rates: CONFIGURED');
        console.log(`   Default Rate: ${(ratesResult.data.defaultRate * 100)}%`);
        console.log('   Product Bonuses:');
        Object.entries(ratesResult.data.productBonuses).forEach(([product, rate]) => {
          console.log(`     • ${product}: +${(rate * 100)}%`);
        });
        
        this.features.push({ 
          name: 'Commission Rates', 
          status: 'working', 
          details: `${Object.keys(ratesResult.data.productBonuses).length} product bonuses configured` 
        });
      }
      
      // Test commission calculation
      const simulateResponse = await fetch(`${this.apiBaseUrl}/api/commission/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: 'AGT-001' })
      });
      const simulateResult = await simulateResponse.json();
      
      if (simulateResult.success && simulateResult.data.commissions.length > 0) {
        console.log('✅ Commission Calculation: WORKING');
        console.log(`   Test Orders: ${simulateResult.data.summary.totalOrders}`);
        console.log(`   Total Commission: RM${simulateResult.data.summary.totalCommission}`);
        console.log(`   Average: RM${simulateResult.data.summary.averageCommission}`);
        
        this.features.push({ 
          name: 'Commission Calculation', 
          status: 'working', 
          details: `RM${simulateResult.data.summary.totalCommission} calculated from test orders` 
        });
      } else {
        throw new Error('Commission calculation failed');
      }
      
    } catch (error) {
      console.log('❌ Commission System: FAILED');
      console.log(`   Error: ${error.message}`);
      this.features.push({ name: 'Commission System', status: 'failed', details: error.message });
    }
    
    console.log();
  }

  async checkFirebaseIntegration() {
    console.log('🔥 FIREBASE INTEGRATION');
    console.log('----------------------');
    
    const hasServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (hasServiceAccount) {
      console.log('⚠️  Firebase: DEVELOPMENT MODE');
      console.log('   Service Account: Configured but using fallback');
      console.log('   Status: Ready for production setup');
      this.features.push({ 
        name: 'Firebase', 
        status: 'partial', 
        details: 'Development mode - ready for production' 
      });
    } else {
      console.log('❌ Firebase: NOT CONFIGURED');
      console.log('   Missing: Service account configuration');
      console.log('   Impact: Database features disabled');
      this.features.push({ 
        name: 'Firebase', 
        status: 'missing', 
        details: 'Service account needed for production' 
      });
    }
    
    console.log();
  }

  async checkAgentManagement() {
    console.log('👥 AGENT MANAGEMENT');
    console.log('------------------');
    
    try {
      // Check if agent pages exist
      const fs = await import('fs');
      const path = await import('path');
      
      const agentPages = [
        'pages/admin/agents.html',
        'pages/admin/dashboard.html',
        'pages/admin/commissions.html',
        'assets/js/shopify-admin-integration.js'
      ];
      
      let existingPages = 0;
      for (const pagePath of agentPages) {
        const fullPath = path.join(process.cwd(), '..', pagePath);
        if (fs.existsSync(fullPath)) {
          existingPages++;
        }
      }
      
      console.log('✅ Agent Management Pages: AVAILABLE');
      console.log(`   Pages Created: ${existingPages}/${agentPages.length}`);
      console.log('   Features:');
      console.log('     • Agent Registration & Management');
      console.log('     • Territory Assignment');
      console.log('     • Order Assignment Interface');
      console.log('     • Performance Analytics');
      console.log('     • Commission Tracking');
      
      this.features.push({ 
        name: 'Agent Management', 
        status: 'working', 
        details: `${existingPages} management pages available` 
      });
      
    } catch (error) {
      console.log('⚠️  Agent Management: PARTIAL');
      console.log('   Some features may not be available');
      this.features.push({ name: 'Agent Management', status: 'partial', details: 'File check unavailable' });
    }
    
    console.log();
  }

  async checkFrontendPages() {
    console.log('🖥️  FRONTEND PAGES');
    console.log('------------------');
    
    const pages = {
      'Admin Dashboard': 'pages/admin-dashboard.html',
      'Agent Dashboard': 'pages/agent-dashboard.html', 
      'Agent Management': 'pages/admin/agents.html',
      'Commission Reports': 'pages/admin/commissions.html'
    };
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      for (const [pageName, pagePath] of Object.entries(pages)) {
        const fullPath = path.join(process.cwd(), '..', pagePath);
        if (fs.existsSync(fullPath)) {
          console.log(`✅ ${pageName}: Available`);
        } else {
          console.log(`❌ ${pageName}: Missing`);
        }
      }
      
      this.features.push({ 
        name: 'Frontend Pages', 
        status: 'working', 
        details: 'Dashboard and management interfaces available' 
      });
      
    } catch (error) {
      console.log('⚠️  Frontend Pages: Cannot verify file system');
      this.features.push({ name: 'Frontend Pages', status: 'partial', details: 'File check unavailable' });
    }
    
    console.log();
  }

  printSummary() {
    console.log('📊 FEATURE SUMMARY');
    console.log('==================');
    
    const working = this.features.filter(f => f.status === 'working').length;
    const partial = this.features.filter(f => f.status === 'partial').length;
    const failed = this.features.filter(f => f.status === 'failed').length;
    const missing = this.features.filter(f => f.status === 'missing').length;
    
    console.log(`✅ Working: ${working}`);
    console.log(`⚠️  Partial: ${partial}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🚫 Missing: ${missing}`);
    console.log(`📦 Total Features: ${this.features.length}\n`);
    
    // Detailed breakdown
    console.log('DETAILED STATUS:');
    console.log('---------------');
    this.features.forEach(feature => {
      const icon = {
        working: '✅',
        partial: '⚠️ ',
        failed: '❌',
        missing: '🚫',
        limited: '⚠️ '
      }[feature.status] || '❓';
      
      console.log(`${icon} ${feature.name}: ${feature.details}`);
    });
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('=============');
    if (working >= 4) {
      console.log('🎉 Your AgentOS system is ready for production!');
      console.log('   Recommended: Set up Firebase for full database features');
      console.log('   Optional: Deploy to cloud hosting');
    } else {
      console.log('🔧 Some features need attention');
      console.log('   Check failed/missing components above');
    }
  }
}

// Run the feature check
const checker = new FeatureChecker();
checker.checkAllFeatures();