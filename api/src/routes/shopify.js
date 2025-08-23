// Shopify API Routes
import express from 'express';
import ShopifyService from '../services/shopify.js';

const router = express.Router();

// Initialize Shopify service
let shopifyService;
try {
  shopifyService = new ShopifyService();
  console.log('✅ Shopify service initialized');
} catch (error) {
  console.error('❌ Shopify service initialization failed:', error.message);
}

// Middleware to check Shopify service availability
const checkShopifyService = (req, res, next) => {
  if (!shopifyService) {
    return res.status(500).json({
      success: false,
      error: 'Shopify service not available. Please check configuration.'
    });
  }
  next();
};

// GET /api/shopify/orders - Fetch orders from Shopify
router.get('/orders', checkShopifyService, async (req, res) => {
  try {
    const {
      limit = 50,
      status = 'any',
      financial_status,
      fulfillment_status,
      created_at_min,
      created_at_max,
      updated_at_min,
      updated_at_max
    } = req.query;

    const params = {
      limit: Math.min(parseInt(limit), 250), // Shopify max limit is 250
      status
    };

    // Add optional parameters
    if (financial_status) params.financial_status = financial_status;
    if (fulfillment_status) params.fulfillment_status = fulfillment_status;
    if (created_at_min) params.created_at_min = created_at_min;
    if (created_at_max) params.created_at_max = created_at_max;
    if (updated_at_min) params.updated_at_min = updated_at_min;
    if (updated_at_max) params.updated_at_max = updated_at_max;

    const result = await shopifyService.getOrders(params);

    if (result.success) {
      // Save orders to Firebase for faster future access
      const firebaseService = req.firebaseService;
      if (result.data.length > 0) {
        await firebaseService.batchSaveOrders(result.data);
      }

      res.json({
        success: true,
        data: result.data,
        count: result.count,
        pagination: result.pagination
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      details: error.message
    });
  }
});

// GET /api/shopify/orders/:id - Fetch specific order
router.get('/orders/:id', checkShopifyService, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await shopifyService.getOrder(id);

    if (result.success) {
      // Save to Firebase
      await req.firebaseService.saveShopifyOrder(result.data);
    }

    res.json(result);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
      details: error.message
    });
  }
});

// POST /api/shopify/orders/:id/assign - Assign order to agent
router.post('/orders/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId, assignedBy } = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required'
      });
    }

    // Verify agent exists
    const agentResult = await req.firebaseService.getAgent(agentId);
    if (!agentResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Assign order
    const result = await req.firebaseService.assignOrderToAgent(id, agentId, assignedBy);

    if (result.success) {
      // TODO: Calculate commission for this order
      // TODO: Send notification to agent
      
      res.json({
        success: true,
        message: 'Order assigned successfully',
        orderId: id,
        agentId: agentId
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Assign order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign order',
      details: error.message
    });
  }
});

// GET /api/shopify/products - Fetch products from Shopify
router.get('/products', checkShopifyService, async (req, res) => {
  try {
    const {
      limit = 50,
      status = 'active',
      vendor,
      product_type,
      created_at_min,
      created_at_max,
      updated_at_min,
      updated_at_max
    } = req.query;

    const params = {
      limit: Math.min(parseInt(limit), 250),
      status
    };

    // Add optional parameters
    if (vendor) params.vendor = vendor;
    if (product_type) params.product_type = product_type;
    if (created_at_min) params.created_at_min = created_at_min;
    if (created_at_max) params.created_at_max = created_at_max;
    if (updated_at_min) params.updated_at_min = updated_at_min;
    if (updated_at_max) params.updated_at_max = updated_at_max;

    const result = await shopifyService.getProducts(params);
    res.json(result);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      details: error.message
    });
  }
});

// GET /api/shopify/customers - Fetch customers from Shopify
router.get('/customers', checkShopifyService, async (req, res) => {
  try {
    const {
      limit = 50,
      created_at_min,
      created_at_max,
      updated_at_min,
      updated_at_max
    } = req.query;

    const params = {
      limit: Math.min(parseInt(limit), 250)
    };

    // Add optional parameters
    if (created_at_min) params.created_at_min = created_at_min;
    if (created_at_max) params.created_at_max = created_at_max;
    if (updated_at_min) params.updated_at_min = updated_at_min;
    if (updated_at_max) params.updated_at_max = updated_at_max;

    const result = await shopifyService.getCustomers(params);
    res.json(result);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers',
      details: error.message
    });
  }
});

// GET /api/shopify/webhooks - List webhooks
router.get('/webhooks', checkShopifyService, async (req, res) => {
  try {
    const result = await shopifyService.getWebhooks();
    res.json(result);
  } catch (error) {
    console.error('Get webhooks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch webhooks',
      details: error.message
    });
  }
});

// POST /api/shopify/webhooks - Create webhook
router.post('/webhooks', checkShopifyService, async (req, res) => {
  try {
    const { topic, address } = req.body;

    if (!topic || !address) {
      return res.status(400).json({
        success: false,
        error: 'Topic and address are required'
      });
    }

    const result = await shopifyService.createWebhook(topic, address);
    res.json(result);
  } catch (error) {
    console.error('Create webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create webhook',
      details: error.message
    });
  }
});

// GET /api/shopify/sync/status - Get sync status and health
router.get('/sync/status', async (req, res) => {
  try {
    const firebaseHealth = await req.firebaseService.isHealthy();
    const shopifyHealth = shopifyService ? true : false;

    res.json({
      success: true,
      status: {
        shopify: shopifyHealth,
        firebase: firebaseHealth.success,
        lastSync: new Date().toISOString(), // TODO: Get actual last sync time
        totalOrdersSynced: 0, // TODO: Get from sync logs
        syncErrors: 0 // TODO: Get error count
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status',
      details: error.message
    });
  }
});

// POST /api/shopify/sync/orders - Manual sync orders
router.post('/sync/orders', checkShopifyService, async (req, res) => {
  try {
    const { limit = 100 } = req.body;

    // Fetch recent orders from Shopify
    const result = await shopifyService.getOrders({ 
      limit: Math.min(limit, 250),
      status: 'any'
    });

    if (result.success && result.data.length > 0) {
      // Save to Firebase
      const saveResult = await req.firebaseService.batchSaveOrders(result.data);
      
      if (saveResult.success) {
        res.json({
          success: true,
          message: `Successfully synced ${result.data.length} orders`,
          syncedCount: result.data.length,
          orders: result.data
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to save orders to Firebase',
          details: saveResult.error
        });
      }
    } else {
      res.json({
        success: true,
        message: 'No orders to sync',
        syncedCount: 0
      });
    }
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync orders',
      details: error.message
    });
  }
});

export default router;