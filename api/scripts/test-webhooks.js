// Webhook Testing Script - Simulates Shopify webhooks locally
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { createHmac } from 'crypto';

dotenv.config();

class WebhookTester {
  constructor() {
    this.serverUrl = 'http://localhost:3002';
    this.webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
  }

  // Generate HMAC signature like Shopify does
  generateHmac(body) {
    if (!this.webhookSecret) {
      console.log('⚠️  No webhook secret found - skipping HMAC verification');
      return 'test-hmac';
    }
    
    return createHmac('sha256', this.webhookSecret)
      .update(body, 'utf8')
      .digest('base64');
  }

  // Test webhook endpoint
  async testEndpoint(endpoint, payload, description) {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`   Endpoint: ${endpoint}`);
    
    try {
      const bodyString = JSON.stringify(payload);
      const hmac = this.generateHmac(bodyString);
      
      const response = await fetch(`${this.serverUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Hmac-Sha256': hmac,
          'X-Shopify-Topic': endpoint.split('/').pop(),
          'X-Shopify-Shop-Domain': `${process.env.SHOPIFY_SHOP_NAME}.myshopify.com`
        },
        body: bodyString
      });

      const responseText = await response.text();
      
      if (response.ok) {
        console.log(`   ✅ Status: ${response.status} - Success`);
        console.log(`   📄 Response: ${responseText.substring(0, 100)}...`);
      } else {
        console.log(`   ❌ Status: ${response.status} - Error`);
        console.log(`   📄 Response: ${responseText}`);
      }
      
      return response.ok;
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return false;
    }
  }

  async runTests() {
    console.log('🚀 Starting Webhook Testing...\n');
    console.log(`🔗 Server URL: ${this.serverUrl}`);
    console.log(`🔐 Webhook Secret: ${this.webhookSecret ? '✅ Configured' : '❌ Missing'}\n`);

    // Test basic connectivity
    console.log('📡 Testing server connectivity...');
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      if (response.ok) {
        console.log('   ✅ Server is running');
      } else {
        console.log('   ❌ Server not responding properly');
        return;
      }
    } catch (error) {
      console.log('   ❌ Server not accessible:', error.message);
      return;
    }

    // Test webhook endpoints
    const tests = [];

    // Test 1: Order Created
    tests.push(this.testEndpoint(
      '/webhooks/shopify/orders/create',
      {
        id: 6940500000000,
        name: '#TEST-001',
        email: 'test@kilangdesamurnibatik.com',
        phone: '+60123456789',
        total_price: '149.00',
        subtotal_price: '149.00',
        currency: 'MYR',
        financial_status: 'pending',
        fulfillment_status: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        customer: {
          id: 8380000000000,
          email: 'test@kilangdesamurnibatik.com',
          first_name: 'Ahmad',
          last_name: 'Batik',
          orders_count: 1,
          total_spent: '149.00'
        },
        shipping_address: {
          first_name: 'Ahmad',
          last_name: 'Batik',
          address1: 'No 123, Jalan Batik',
          city: 'Kuala Lumpur',
          zip: '50000',
          country: 'Malaysia',
          phone: '+60123456789'
        },
        line_items: [{
          id: 19140000000000,
          product_id: 7469366902874,
          title: 'Test Batik Fabric - Premium Cotton',
          quantity: 2,
          price: '74.50',
          sku: 'TEST-BATIK-001',
          vendor: 'DESA MURNI BATIK KILANG'
        }]
      },
      'Order Created Webhook'
    ));

    // Test 2: Order Paid
    tests.push(this.testEndpoint(
      '/webhooks/shopify/orders/paid',
      {
        id: 6940500000001,
        name: '#TEST-002',
        email: 'customer@example.com',
        total_price: '98.00',
        currency: 'MYR',
        financial_status: 'paid',
        created_at: new Date().toISOString(),
        customer: {
          id: 8380000000001,
          email: 'customer@example.com',
          first_name: 'Siti',
          last_name: 'Ahmad'
        },
        line_items: [{
          id: 19140000000001,
          title: 'Baju Melayu Adam - Olive Green',
          quantity: 1,
          price: '95.00'
        }]
      },
      'Order Paid Webhook'
    ));

    // Test 3: Order Fulfilled
    tests.push(this.testEndpoint(
      '/webhooks/shopify/orders/fulfilled',
      {
        id: 12345,
        order_id: 6940500000002,
        created_at: new Date().toISOString(),
        tracking_number: 'MY1234567890',
        tracking_company: 'PosLaju',
        tracking_url: 'https://www.pos.com.my/send/track'
      },
      'Order Fulfilled Webhook'
    ));

    // Test 4: Customer Created
    tests.push(this.testEndpoint(
      '/webhooks/shopify/customers/create',
      {
        id: 8380000000002,
        email: 'newcustomer@gmail.com',
        first_name: 'Azman',
        last_name: 'Rahman',
        phone: '+60198765432',
        created_at: new Date().toISOString(),
        orders_count: 0,
        total_spent: '0.00'
      },
      'Customer Created Webhook'
    ));

    // Run all tests
    const results = await Promise.all(tests);
    const successCount = results.filter(r => r).length;
    const totalTests = results.length;

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`✅ Passed: ${successCount}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - successCount}/${totalTests}`);
    
    if (successCount === totalTests) {
      console.log('\n🎉 All webhook endpoints are working perfectly!');
      console.log('\n📋 Next Steps:');
      console.log('   1. ✅ Webhook endpoints are ready');
      console.log('   2. 🌐 Deploy to production with HTTPS');
      console.log('   3. 🔗 Register webhooks with production URL');
      console.log('   4. 📱 Test with real Shopify orders');
    } else {
      console.log('\n⚠️  Some webhook endpoints need attention');
      console.log('   Check the server logs for detailed error information');
    }

    console.log('\n💡 For Production:');
    console.log('   • Deploy your API to a cloud service (Railway, Render, etc.)');
    console.log('   • Get HTTPS URL (automatic with most cloud services)');
    console.log('   • Update WEBHOOK_BASE_URL in production .env');
    console.log('   • Run webhook setup script with production URL');
  }

  // Test just the test endpoint
  async testBasic() {
    console.log('🧪 Testing basic webhook endpoint...\n');
    
    try {
      const response = await fetch(`${this.serverUrl}/webhooks/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, timestamp: new Date().toISOString() })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Basic webhook test passed!');
        console.log('📄 Response:', JSON.stringify(result, null, 2));
      } else {
        console.log('❌ Basic webhook test failed');
        console.log('Response:', result);
      }
    } catch (error) {
      console.log('❌ Error testing basic webhook:', error.message);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'full';
  
  const tester = new WebhookTester();
  
  switch (command) {
    case 'full':
      await tester.runTests();
      break;
    case 'basic':
      await tester.testBasic();
      break;
    default:
      console.log('Usage: node test-webhooks.js [full|basic]');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default WebhookTester;