// Setup Shopify Webhooks Script
import dotenv from 'dotenv';
import ShopifyService from '../src/services/shopify.js';

dotenv.config();

async function setupWebhooks() {
  try {
    console.log('🔧 Setting up Shopify webhooks...');
    
    const shopifyService = new ShopifyService();
    const baseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3002';
    
    const webhooks = [
      {
        topic: 'orders/create',
        address: `${baseUrl}/webhooks/shopify/orders/create`
      },
      {
        topic: 'orders/updated',
        address: `${baseUrl}/webhooks/shopify/orders/updated`
      },
      {
        topic: 'orders/paid',
        address: `${baseUrl}/webhooks/shopify/orders/paid`
      },
      {
        topic: 'orders/fulfilled',
        address: `${baseUrl}/webhooks/shopify/orders/fulfilled`
      },
      {
        topic: 'customers/create',
        address: `${baseUrl}/webhooks/shopify/customers/create`
      }
    ];

    // Get existing webhooks first
    console.log('📋 Checking existing webhooks...');
    const existingResult = await shopifyService.getWebhooks();
    
    if (existingResult.success) {
      console.log(`Found ${existingResult.data.length} existing webhooks`);
      existingResult.data.forEach(webhook => {
        console.log(`  - ${webhook.topic}: ${webhook.address}`);
      });
    }

    // Create new webhooks (skip if already exists)
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const webhook of webhooks) {
      console.log(`\n🔗 Processing webhook: ${webhook.topic}`);
      
      // Check if webhook already exists
      const existing = existingResult.success && existingResult.data.find(w => 
        w.topic === webhook.topic && w.address === webhook.address
      );

      if (existing) {
        console.log(`⏭️  Webhook already exists (ID: ${existing.id})`);
        skippedCount++;
        continue;
      }
      
      const result = await shopifyService.createWebhook(webhook.topic, webhook.address);
      
      if (result.success) {
        console.log(`✅ Successfully created webhook for ${webhook.topic}`);
        console.log(`   ID: ${result.data.id}`);
        console.log(`   Address: ${result.data.address}`);
        successCount++;
      } else {
        console.error(`❌ Failed to create webhook for ${webhook.topic}`);
        console.error(`   Error: ${result.error}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Webhook setup complete:`);
    console.log(`   ✅ Created: ${successCount}`);
    console.log(`   ⏭️  Skipped (already exist): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n💡 Note: Some webhooks may already exist or there might be configuration issues.');
      console.log('   Check your Shopify admin or use different webhook URLs.');
    }

  } catch (error) {
    console.error('🚨 Webhook setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupWebhooks();