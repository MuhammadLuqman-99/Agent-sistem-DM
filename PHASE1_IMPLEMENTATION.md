# 🚀 Phase 1: Shopify Integration Foundation

## Objective: Add Shopify Integration to Current System

Keep existing AgentOS frontend, add powerful backend API layer with Shopify sync.

## Week 1: Setup & Planning

### Day 1-2: Shopify Development Environment
```bash
# 1. Create Shopify Partner Account
https://partners.shopify.com/signup

# 2. Create Development Store
- Store name: agentos-dev-store
- Purpose: Testing AgentOS integration
- Install sample products and orders

# 3. Generate Private App Credentials
- Admin API access token
- Webhook endpoints
- Required scopes: read_orders, read_products, read_customers
```

### Day 3-4: Express API Setup
```bash
# Create API directory
mkdir api
cd api

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express cors helmet morgan
npm install axios dotenv
npm install firebase-admin
npm install node-cron  # For scheduled tasks
npm install express-rate-limit

# Development dependencies
npm install -D nodemon concurrently
```

### Day 5-7: Basic Project Structure
```
deepseek/
├── frontend/ (Current AgentOS files)
│   ├── pages/
│   ├── assets/
│   └── config/
├── api/ (New Express server)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── shopify.js
│   │   │   ├── agents.js
│   │   │   └── webhooks.js
│   │   ├── services/
│   │   │   ├── shopify.js
│   │   │   ├── firebase.js
│   │   │   └── commission.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── validation.js
│   │   └── utils/
│   │       └── logger.js
│   ├── .env
│   ├── package.json
│   └── server.js
└── shared/
    └── constants.js
```

## Week 2: Core API Development

### Basic Express Server Setup
```javascript
// api/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import shopifyRoutes from './src/routes/shopify.js';
import agentRoutes from './src/routes/agents.js';
import webhookRoutes from './src/routes/webhooks.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.use('/api/shopify', shopifyRoutes);
app.use('/api/agents', agentRoutes);
app.use('/webhooks', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AgentOS API Server running on port ${PORT}`);
});
```

### Shopify Service Implementation
```javascript
// api/src/services/shopify.js
import axios from 'axios';

class ShopifyService {
  constructor() {
    this.shopName = process.env.SHOPIFY_SHOP_NAME;
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    this.apiVersion = '2023-07';
    
    this.client = axios.create({
      baseURL: `https://${this.shopName}.myshopify.com/admin/api/${this.apiVersion}`,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json'
      }
    });
  }

  async getOrders(params = {}) {
    try {
      const response = await this.client.get('/orders.json', { params });
      return {
        success: true,
        data: response.data.orders.map(this.transformOrder),
        count: response.data.orders.length
      };
    } catch (error) {
      console.error('Shopify API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || error.message
      };
    }
  }

  async getProducts(params = {}) {
    try {
      const response = await this.client.get('/products.json', { params });
      return {
        success: true,
        data: response.data.products.map(this.transformProduct),
        count: response.data.products.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errors || error.message
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
      return { success: true, data: response.data.webhook };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errors || error.message
      };
    }
  }

  transformOrder(order) {
    return {
      id: order.id.toString(),
      orderNumber: order.order_number,
      name: order.name,
      email: order.email,
      phone: order.phone,
      total: parseFloat(order.total_price),
      subtotal: parseFloat(order.subtotal_price),
      taxes: parseFloat(order.total_tax),
      currency: order.currency,
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      customer: order.customer ? {
        id: order.customer.id.toString(),
        email: order.customer.email,
        firstName: order.customer.first_name,
        lastName: order.customer.last_name,
        phone: order.customer.phone
      } : null,
      shippingAddress: order.shipping_address,
      billingAddress: order.billing_address,
      lineItems: order.line_items.map(item => ({
        id: item.id.toString(),
        productId: item.product_id?.toString(),
        variantId: item.variant_id?.toString(),
        title: item.title,
        quantity: item.quantity,
        price: parseFloat(item.price),
        totalDiscount: parseFloat(item.total_discount)
      })),
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at),
      // AgentOS specific fields
      assignedAgent: null,
      commissionCalculated: false,
      agentNotes: ''
    };
  }

  transformProduct(product) {
    return {
      id: product.id.toString(),
      title: product.title,
      description: product.body_html,
      vendor: product.vendor,
      productType: product.product_type,
      handle: product.handle,
      status: product.status,
      images: product.images.map(img => ({
        id: img.id.toString(),
        src: img.src,
        alt: img.alt
      })),
      variants: product.variants.map(variant => ({
        id: variant.id.toString(),
        title: variant.title,
        price: parseFloat(variant.price),
        sku: variant.sku,
        inventoryQuantity: variant.inventory_quantity,
        weight: variant.weight,
        weightUnit: variant.weight_unit
      })),
      createdAt: new Date(product.created_at),
      updatedAt: new Date(product.updated_at)
    };
  }
}

export default ShopifyService;
```

### Simple Commission Calculator
```javascript
// api/src/services/commission.js
class CommissionService {
  constructor(firebaseService) {
    this.firebase = firebaseService;
  }

  async calculateOrderCommission(order, agentId) {
    try {
      // Get agent commission rate (default 5%)
      const agent = await this.firebase.getAgent(agentId);
      const commissionRate = agent?.commissionRate || 0.05;
      
      // Simple commission calculation
      const baseCommission = order.total * commissionRate;
      
      const commission = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        agentId: agentId,
        orderTotal: order.total,
        commissionRate: commissionRate,
        baseCommission: baseCommission,
        bonuses: 0, // Future: volume bonuses, product bonuses
        totalCommission: baseCommission,
        status: 'pending',
        calculatedAt: new Date(),
        payoutDate: this.getNextPayoutDate()
      };

      // Save to Firebase
      await this.firebase.saveCommission(commission);
      
      return {
        success: true,
        commission
      };
    } catch (error) {
      console.error('Commission calculation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getNextPayoutDate() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
  }

  async getAgentCommissions(agentId, startDate, endDate) {
    try {
      const commissions = await this.firebase.getAgentCommissions(agentId, startDate, endDate);
      
      const summary = {
        totalCommissions: commissions.reduce((sum, c) => sum + c.totalCommission, 0),
        pendingCommissions: commissions.filter(c => c.status === 'pending').length,
        paidCommissions: commissions.filter(c => c.status === 'paid').length,
        commissions: commissions
      };

      return { success: true, data: summary };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default CommissionService;
```

## Week 3: Frontend Integration

### Update Current Frontend to Use API
```javascript
// frontend/assets/js/shopify-integration.js
class ShopifyIntegration {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
    this.orders = [];
    this.products = [];
  }

  async fetchShopifyOrders() {
    try {
      const response = await fetch(`${this.apiBase}/shopify/orders`);
      const data = await response.json();
      
      if (data.success) {
        this.orders = data.data;
        this.updateOrdersTable();
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showNotification('Failed to fetch orders from Shopify', 'error');
    }
  }

  async assignOrderToAgent(orderId, agentId) {
    try {
      const response = await fetch(`${this.apiBase}/shopify/orders/${orderId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification('Order assigned successfully!', 'success');
        this.fetchShopifyOrders(); // Refresh orders
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error assigning order:', error);
      showNotification('Failed to assign order', 'error');
    }
  }

  updateOrdersTable() {
    const tableBody = document.querySelector('#shopify-orders-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    this.orders.forEach(order => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${order.orderNumber}</td>
        <td>${order.customer?.firstName} ${order.customer?.lastName}</td>
        <td>RM${order.total.toFixed(2)}</td>
        <td><span class="status-badge ${this.getStatusClass(order.financialStatus)}">${order.financialStatus}</span></td>
        <td>${order.assignedAgent || 'Unassigned'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="shopifyIntegration.assignOrder('${order.id}')">
            Assign
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  getStatusClass(status) {
    const statusMap = {
      'paid': 'success',
      'pending': 'warning',
      'refunded': 'error'
    };
    return statusMap[status] || 'secondary';
  }

  assignOrder(orderId) {
    const agentId = localStorage.getItem('userId'); // Current logged-in agent
    this.assignOrderToAgent(orderId, agentId);
  }
}

// Initialize when page loads
const shopifyIntegration = new ShopifyIntegration();

// Auto-fetch orders for agents
if (window.location.pathname.includes('agent-dashboard.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    shopifyIntegration.fetchShopifyOrders();
  });
}
```

### Add Shopify Orders Section to Agent Dashboard
```html
<!-- Add this to agent-dashboard.html -->
<div class="card">
    <div class="card-header">
        <h2>Shopify Orders</h2>
        <button onclick="shopifyIntegration.fetchShopifyOrders()" class="btn btn-secondary">
            <i class="fas fa-sync"></i> Refresh
        </button>
    </div>
    <div class="table-container">
        <table id="shopify-orders-table">
            <thead>
                <tr>
                    <th>Order Number</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Assigned Agent</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <!-- Orders will be populated by JavaScript -->
            </tbody>
        </table>
    </div>
</div>

<!-- Add script -->
<script src="../assets/js/shopify-integration.js"></script>
```

## Week 4: Testing & Refinement

### Environment Setup
```bash
# .env file for API
SHOPIFY_SHOP_NAME=agentos-dev-store
SHOPIFY_ACCESS_TOKEN=your_access_token_here
FIREBASE_SERVICE_ACCOUNT=path_to_service_account.json
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Testing Checklist
```markdown
□ Shopify API connection working
□ Orders fetching from development store
□ Basic commission calculation
□ Frontend displaying Shopify orders
□ Order assignment functionality
□ Error handling and logging
□ Commission data saving to Firebase
```

### Package.json Scripts
```json
{
  "name": "agentos-api",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "test": "echo 'Tests coming soon...'",
    "setup-webhooks": "node scripts/setup-webhooks.js"
  },
  "type": "module"
}
```

## Expected Results After Phase 1

### ✅ What You'll Have:
1. **Working API server** that connects to Shopify
2. **Real Shopify orders** displaying in current AgentOS
3. **Basic commission calculation** for orders
4. **Order assignment** to agents
5. **Foundation for advanced features**

### 📊 Demo Flow:
1. Create test order in Shopify dev store
2. Order appears in AgentOS agent dashboard
3. Agent can assign order to themselves
4. Commission automatically calculated
5. Data saved to Firebase

### 🚀 Ready for Phase 2:
- Webhooks for real-time sync
- Advanced commission rules  
- Territory management
- Enhanced UI components

---

This Phase 1 approach akan give you **immediate results** dengan **minimal risk**. Anda boleh test Shopify integration dengan current system, then decide next steps berdasarkan results! 

Ready untuk start dengan Shopify Partner account? 🛍️