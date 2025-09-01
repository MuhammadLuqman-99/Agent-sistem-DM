// Shopify API Service
import axios from 'axios';
import dotenv from 'dotenv';
import axiosRetry from 'axios-retry';
import crypto from 'crypto';

dotenv.config();

class ShopifyService {
  constructor() {
    this.shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    this.apiVersion = '2023-10';
    
    if (!this.shopDomain || !this.accessToken) {
      throw new Error('Shopify configuration missing. Please check SHOPIFY_SHOP_DOMAIN and SHOPIFY_ACCESS_TOKEN in .env file');
    }
    
    // Extract shop name from domain
    this.shopName = this.shopDomain.replace('.myshopify.com', '');
    
    // Configure axios client with retry logic
    this.client = axios.create({
      baseURL: `https://${this.shopDomain}/admin/api/${this.apiVersion}`,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    // Add retry configuration for transient errors
    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        // Retry on network errors or 5xx server errors
        return axiosRetry.isNetworkError(error) || 
          (error.response && error.response.status >= 500);
      }
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`Shopify API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Shopify API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`Shopify API Response: ${response.status} - ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('Shopify API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  async getOrders(params = {}) {
    try {
      // Default parameters
      const defaultParams = {
        limit: 50,
        status: 'any',
        financial_status: 'any',
        fulfillment_status: 'any',
        fields: 'id,order_number,name,email,phone,total_price,subtotal_price,total_tax,currency,financial_status,fulfillment_status,created_at,updated_at,customer,shipping_address,billing_address,line_items'
      };

      const queryParams = { ...defaultParams, ...params };
      
      const response = await this.client.get('/orders.json', { params: queryParams });
      
      return {
        success: true,
        data: response.data.orders.map(this.transformOrder),
        count: response.data.orders.length,
        pagination: this.extractPaginationInfo(response.headers)
      };
    } catch (error) {
      console.error('Shopify getOrders Error:', error.response?.data || error.message);
      return {
        success: false,
        error: this.formatError(error),
        details: error.response?.data
      };
    }
  }

  async getOrder(orderId) {
    try {
      const response = await this.client.get(`/orders/${orderId}.json`);
      return {
        success: true,
        data: this.transformOrder(response.data.order)
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  async getProducts(params = {}) {
    try {
      const defaultParams = {
        limit: 50,
        status: 'active',
        fields: 'id,title,body_html,vendor,product_type,handle,status,created_at,updated_at,images,variants'
      };

      const queryParams = { ...defaultParams, ...params };
      
      const response = await this.client.get('/products.json', { params: queryParams });
      
      return {
        success: true,
        data: response.data.products.map(this.transformProduct),
        count: response.data.products.length
      };
    } catch (error) {
      console.error('Shopify getProducts Error:', error.response?.data || error.message);
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  async getCustomers(params = {}) {
    try {
      const defaultParams = {
        limit: 50,
        fields: 'id,email,first_name,last_name,phone,created_at,updated_at,orders_count,total_spent'
      };

      const queryParams = { ...defaultParams, ...params };
      
      const response = await this.client.get('/customers.json', { params: queryParams });
      
      return {
        success: true,
        data: response.data.customers.map(this.transformCustomer),
        count: response.data.customers.length
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  async createWebhook(topic, address) {
    try {
      const response = await this.client.post('/webhooks.json', {
        webhook: {
          topic,
          address,
          format: 'json'
        }
      });
      
      return { 
        success: true, 
        data: response.data.webhook 
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  async getWebhooks() {
    try {
      const response = await this.client.get('/webhooks.json');
      return {
        success: true,
        data: response.data.webhooks
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  // Transform Shopify order to AgentOS format
  transformOrder(order) {
    return {
      id: order.id.toString(),
      orderNumber: order.order_number,
      name: order.name,
      email: order.email,
      phone: order.phone,
      total: parseFloat(order.total_price || 0),
      subtotal: parseFloat(order.subtotal_price || 0),
      taxes: parseFloat(order.total_tax || 0),
      currency: order.currency,
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      customer: order.customer ? {
        id: order.customer.id.toString(),
        email: order.customer.email,
        firstName: order.customer.first_name,
        lastName: order.customer.last_name,
        fullName: `${order.customer.first_name} ${order.customer.last_name}`,
        phone: order.customer.phone,
        ordersCount: order.customer.orders_count || 0,
        totalSpent: parseFloat(order.customer.total_spent || 0)
      } : null,
      shippingAddress: order.shipping_address,
      billingAddress: order.billing_address,
      lineItems: order.line_items?.map(item => ({
        id: item.id.toString(),
        productId: item.product_id?.toString(),
        variantId: item.variant_id?.toString(),
        title: item.title,
        variantTitle: item.variant_title,
        quantity: item.quantity,
        price: parseFloat(item.price || 0),
        totalDiscount: parseFloat(item.total_discount || 0),
        sku: item.sku,
        vendor: item.vendor
      })) || [],
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at),
      // AgentOS specific fields
      assignedAgent: null,
      commissionCalculated: false,
      commissionAmount: 0,
      agentNotes: '',
      followUpDate: null,
      priority: 'normal'
    };
  }

  // Transform Shopify product to AgentOS format
  transformProduct(product) {
    return {
      id: product.id.toString(),
      title: product.title,
      description: product.body_html,
      vendor: product.vendor,
      productType: product.product_type,
      handle: product.handle,
      status: product.status,
      images: product.images?.map(img => ({
        id: img.id.toString(),
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height
      })) || [],
      variants: product.variants?.map(variant => ({
        id: variant.id.toString(),
        title: variant.title,
        price: parseFloat(variant.price || 0),
        compareAtPrice: parseFloat(variant.compare_at_price || 0),
        sku: variant.sku,
        barcode: variant.barcode,
        inventoryQuantity: variant.inventory_quantity,
        weight: variant.weight,
        weightUnit: variant.weight_unit
      })) || [],
      createdAt: new Date(product.created_at),
      updatedAt: new Date(product.updated_at)
    };
  }

  // Transform Shopify customer to AgentOS format
  transformCustomer(customer) {
    return {
      id: customer.id.toString(),
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      fullName: `${customer.first_name} ${customer.last_name}`,
      phone: customer.phone,
      ordersCount: customer.orders_count || 0,
      totalSpent: parseFloat(customer.total_spent || 0),
      createdAt: new Date(customer.created_at),
      updatedAt: new Date(customer.updated_at),
      // AgentOS specific fields
      assignedAgent: null,
      lastContactDate: null,
      leadScore: this.calculateLeadScore(customer),
      tags: []
    };
  }

  // Calculate simple lead score based on customer data
  calculateLeadScore(customer) {
    let score = 0;
    
    // Orders count (max 30 points)
    score += Math.min(customer.orders_count * 5, 30);
    
    // Total spent (max 40 points)
    const spentScore = Math.min(customer.total_spent / 100, 40);
    score += spentScore;
    
    // Recent activity (max 30 points)
    const daysSinceLastOrder = (new Date() - new Date(customer.updated_at)) / (1000 * 60 * 60 * 24);
    const recentScore = Math.max(30 - daysSinceLastOrder / 10, 0);
    score += recentScore;
    
    return Math.round(score);
  }

  // Extract pagination information from response headers
  extractPaginationInfo(headers) {
    const linkHeader = headers.link;
    if (!linkHeader) return null;

    const links = {};
    const parts = linkHeader.split(',');
    
    parts.forEach(part => {
      const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
      if (match) {
        links[match[2]] = match[1];
      }
    });

    return links;
  }

  // Format error messages consistently
  formatError(error) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        return 'Unauthorized: Please check your Shopify access token';
      } else if (status === 403) {
        return 'Forbidden: Insufficient permissions';
      } else if (status === 404) {
        return 'Resource not found';
      } else if (status === 429) {
        return 'Rate limit exceeded. Please try again later';
      } else if (data && data.errors) {
        return Array.isArray(data.errors) ? data.errors.join(', ') : JSON.stringify(data.errors);
      }
      
      return `HTTP ${status}: ${error.response.statusText}`;
    } else if (error.request) {
      // Request made but no response
      return 'Network error: Unable to connect to Shopify';
    } else {
      // Something else happened
      return error.message || 'Unknown error occurred';
    }
  }

  // Create order in Shopify
  async createOrder(orderData) {
    try {
      const shopifyOrder = {
        order: {
          line_items: orderData.line_items.map(item => ({
            variant_id: parseInt(item.variant_id),
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price)
          })),
          customer: {
            first_name: orderData.customer.first_name,
            last_name: orderData.customer.last_name,
            email: orderData.customer.email,
            phone: orderData.customer.phone
          },
          financial_status: 'pending',
          send_receipt: false,
          send_fulfillment_receipt: false,
          note: orderData.note || 'Created via AgentOS'
        }
      };

      const response = await this.client.post('/orders.json', shopifyOrder);
      
      if (response.data && response.data.order) {
        return {
          success: true,
          data: response.data.order,
          message: 'Order created successfully in Shopify'
        };
      } else {
        return {
          success: false,
          error: 'Invalid response from Shopify'
        };
      }
    } catch (error) {
      console.error('Create order error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create order in Shopify'
      };
    }
  }

  // Verify webhook authenticity
  verifyWebhook(data, hmacHeader) {
    if (!process.env.SHOPIFY_WEBHOOK_SECRET) {
      console.warn('SHOPIFY_WEBHOOK_SECRET not configured');
      return false;
    }

    const calculated_hmac = crypto
      .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
      .update(data, 'utf8')
      .digest('base64');

    return calculated_hmac === hmacHeader;
  }
}

export default ShopifyService;
