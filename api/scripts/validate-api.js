#!/usr/bin/env node

/**
 * AgentOS API Validation Script
 * Tests all API endpoints and identifies issues
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class APIValidator {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async testEndpoint(method, endpoint, description, expectedStatus = 200, data = null) {
    try {
      console.log(`\n🧪 Testing: ${description}`);
      console.log(`   ${method} ${endpoint}`);
      
      const config = {
        method: method.toLowerCase(),
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (data && method !== 'GET') {
        config.data = data;
      }

      const response = await axios(config);
      
      if (response.status === expectedStatus) {
        console.log(`   ✅ Status: ${response.status} - Success`);
        this.results.passed++;
        return true;
      } else {
        console.log(`   ❌ Status: ${response.status} - Expected ${expectedStatus}`);
        this.results.failed++;
        this.results.errors.push(`${method} ${endpoint}: Expected ${expectedStatus}, got ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      this.results.failed++;
      this.results.errors.push(`${method} ${endpoint}: ${error.message}`);
      return false;
    }
  }

  async runTests() {
    console.log('🔍 AgentOS API Validation');
    console.log('==========================\n');
    console.log(`🔗 Base URL: ${this.baseUrl}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);

    // Test basic connectivity
    await this.testEndpoint('GET', '/health', 'Health Check Endpoint');
    await this.testEndpoint('GET', '/api', 'API Documentation Endpoint');

    // Test Shopify endpoints (may fail if not configured)
    await this.testEndpoint('GET', '/api/shopify/orders?limit=5', 'Shopify Orders Endpoint');
    await this.testEndpoint('GET', '/api/shopify/products?limit=5', 'Shopify Products Endpoint');
    await this.testEndpoint('GET', '/api/shopify/customers?limit=5', 'Shopify Customers Endpoint');

    // Test agent endpoints
    await this.testEndpoint('GET', '/api/agents', 'Agents List Endpoint');
    
    // Test order endpoints
    await this.testEndpoint('GET', '/api/orders?limit=10', 'Orders List Endpoint');
    
    // Test commission endpoints
    await this.testEndpoint('GET', '/api/commission/agent/test-agent-id', 'Agent Commission Endpoint', 404);

    // Test webhook endpoints (should return 401 without proper signature)
    await this.testEndpoint('POST', '/webhooks/shopify/orders/create', 'Webhook Orders Create Endpoint', 401);

    this.printResults();
  }

  printResults() {
    console.log('\n📊 Validation Results');
    console.log('=====================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);

    if (this.results.errors.length > 0) {
      console.log('\n⚠️  Issues Found:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (this.results.failed === 0) {
      console.log('\n🎉 All API endpoints are working correctly!');
    } else {
      console.log('\n💡 Some endpoints may need configuration or are expected to fail in development mode.');
    }
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new APIValidator();
  validator.runTests().catch(console.error);
}

export default APIValidator;
