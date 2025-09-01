// Order Management Routes - Updated for Railway deployment
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { logAgentActivity } from '../services/firebase.js';

const router = express.Router();

// Validation middleware for order creation
const validateOrderCreation = [
  body('customer.email').isEmail().withMessage('Customer email is required and must be valid'),
  body('customer.first_name').notEmpty().withMessage('Customer first name is required'),
  body('customer.last_name').notEmpty().withMessage('Customer last name is required'),
  body('line_items').isArray({ min: 1 }).withMessage('At least one line item is required'),
  body('line_items.*.variant_id').notEmpty().withMessage('Variant ID is required for each item'),
  body('line_items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('line_items.*.price').isFloat({ min: 0 }).withMessage('Price must be a valid number'),
  body('agent_id').notEmpty().withMessage('Agent ID is required')
];

// GET /api/orders - Get all orders (admin view)
router.get('/', async (req, res) => {
  try {
    const { limit = 100, agentId, status } = req.query;
    
    let result;
    if (agentId) {
      result = await req.firebaseService.getAgentOrders(agentId, parseInt(limit));
    } else {
      result = await req.firebaseService.getAllOrders(parseInt(limit));
    }
    
    // Filter by status if provided
    if (status && result.success) {
      result.data = result.data.filter(order => 
        order.financialStatus === status || order.fulfillmentStatus === status
      );
    }
    
    res.json(result);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      details: error.message
    });
  }
});

// GET /api/orders/:id - Get specific order
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.firebaseService.getShopifyOrder(id);
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

// POST /api/orders/:id/assign - Assign order to agent
router.post('/:id/assign', async (req, res) => {
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
    
    const result = await req.firebaseService.assignOrderToAgent(id, agentId, assignedBy);
    res.json(result);
  } catch (error) {
    console.error('Assign order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign order',
      details: error.message
    });
  }
});

// PUT /api/orders/:id/notes - Update order notes
router.put('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, agentId } = req.body;
    
    if (!notes) {
      return res.status(400).json({
        success: false,
        error: 'Notes are required'
      });
    }
    
    // Update order with agent notes
    const updateData = {
      agentNotes: notes,
      lastUpdatedBy: agentId,
      updatedAt: new Date()
    };
    
    // TODO: Create updateShopifyOrder method in FirebaseService
    // For now, we'll use a generic approach
    const result = await req.firebaseService.updateUser(id, updateData);
    res.json(result);
  } catch (error) {
    console.error('Update order notes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order notes',
      details: error.message
    });
  }
});

// GET /api/orders/stats/summary - Get order statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { agentId, startDate, endDate } = req.query;
    
    // Get orders based on filters
    let result;
    if (agentId) {
      result = await req.firebaseService.getAgentOrders(agentId, 1000);
    } else {
      result = await req.firebaseService.getAllOrders(1000);
    }
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    let orders = result.data;
    
    // Filter by date range if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate) : new Date();
      
      orders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start && orderDate <= end;
      });
    }
    
    // Calculate statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    const paidOrders = orders.filter(order => order.financialStatus === 'paid').length;
    const pendingOrders = orders.filter(order => order.financialStatus === 'pending').length;
    const refundedOrders = orders.filter(order => order.financialStatus === 'refunded').length;
    
    const fulfilledOrders = orders.filter(order => order.fulfillmentStatus === 'fulfilled').length;
    const partiallyFulfilledOrders = orders.filter(order => order.fulfillmentStatus === 'partial').length;
    const unfulfilledOrders = orders.filter(order => !order.fulfillmentStatus || order.fulfillmentStatus === 'unfulfilled').length;
    
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Group by date for trend analysis
    const ordersByDate = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!ordersByDate[date]) {
        ordersByDate[date] = { count: 0, revenue: 0 };
      }
      ordersByDate[date].count++;
      ordersByDate[date].revenue += order.total || 0;
    });
    
    const stats = {
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2))
      },
      financial: {
        paid: paidOrders,
        pending: pendingOrders,
        refunded: refundedOrders
      },
      fulfillment: {
        fulfilled: fulfilledOrders,
        partiallyFulfilled: partiallyFulfilledOrders,
        unfulfilled: unfulfilledOrders
      },
      trends: ordersByDate
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order statistics',
      details: error.message
    });
  }
});

// POST /api/orders - Create new order in Shopify
router.post('/', async (req, res) => {
  try {
    console.log('Creating new order:', JSON.stringify(req.body, null, 2));
    
    const orderData = req.body;
    
    // Basic validation
    if (!orderData.customer || !orderData.customer.first_name || !orderData.customer.phone) {
      return res.status(400).json({
        success: false,
        error: 'Customer information (name and phone) is required'
      });
    }
    
    if (!orderData.line_items || orderData.line_items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one product is required'
      });
    }
    
    // Ensure customer has email (required by Shopify)
    if (!orderData.customer.email) {
      // Generate temporary email if not provided
      const phoneDigits = orderData.customer.phone.replace(/\D/g, '');
      orderData.customer.email = `${phoneDigits}@agent-temp.com`;
    }
    
    // Check if Shopify service is available
    if (!req.shopifyService) {
      console.log('Shopify service not available, saving order locally');
      
      // Save to Firebase only (for testing/fallback)
      const localOrder = {
        id: `local_${Date.now()}`,
        order_number: `#${Date.now()}`,
        name: `#${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_price: orderData.line_items.reduce((sum, item) => 
          sum + (parseFloat(item.price) * parseInt(item.quantity)), 0
        ).toFixed(2),
        financial_status: 'pending',
        fulfillment_status: null,
        customer: orderData.customer,
        line_items: orderData.line_items.map(item => ({
          ...item,
          id: `item_${Date.now()}_${Math.random()}`,
          total_price: (parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)
        })),
        note: orderData.note || 'Created via Agent Dashboard',
        tags: orderData.tags || 'agent-sale'
      };
      
      // Save to Firebase
      const firebaseResult = await req.firebaseService.saveShopifyOrder(localOrder);
      
      return res.status(201).json({
        success: true,
        data: {
          order_number: localOrder.order_number,
          id: localOrder.id,
          total_price: localOrder.total_price,
          created_at: localOrder.created_at
        },
        message: 'Order created successfully (local storage)'
      });
    }
    
    // Create order in Shopify
    console.log('Creating order in Shopify...');
    const shopifyResult = await req.shopifyService.createOrder(orderData);
    
    if (!shopifyResult.success) {
      console.error('Shopify order creation failed:', shopifyResult.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create order in Shopify',
        details: shopifyResult.error
      });
    }
    
    // Save to Firebase
    try {
      await req.firebaseService.saveShopifyOrder(shopifyResult.data);
      console.log('Order saved to Firebase successfully');
    } catch (firebaseError) {
      console.warn('Firebase save failed (order still created in Shopify):', firebaseError.message);
    }
    
    // Log agent activity for admin monitoring
    const agentId = req.body.agent_id || 'system';
    await logAgentActivity(agentId, {
      type: 'order_created',
      details: {
        orderId: shopifyResult.data.id,
        orderNumber: shopifyResult.data.order_number || shopifyResult.data.name,
        customerName: orderData.customer.first_name + ' ' + orderData.customer.last_name,
        totalAmount: shopifyResult.data.total_price,
        itemCount: orderData.line_items.length,
        source: 'shopify_api'
      },
      status: 'completed'
    });

    res.status(201).json({
      success: true,
      data: {
        order_number: shopifyResult.data.order_number || shopifyResult.data.name,
        id: shopifyResult.data.id,
        total_price: shopifyResult.data.total_price,
        created_at: shopifyResult.data.created_at
      },
      message: 'Order created successfully in Shopify'
    });
    
  } catch (error) {
    console.error('Order creation error:', error);
    
    // Log failed order attempt for admin monitoring
    const agentId = req.body.agent_id || 'system';
    await logAgentActivity(agentId, {
      type: 'order_failed',
      details: {
        customerName: req.body.customer ? 
          `${req.body.customer.first_name} ${req.body.customer.last_name}` : 'Unknown',
        error: error.message,
        itemCount: req.body.line_items ? req.body.line_items.length : 0,
        source: 'shopify_api'
      },
      status: 'failed'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: error.message
    });
  }
});

// ORIGINAL POST route with full validation (commented out for debugging)
/* 
router.post('/create-full', authenticateToken, validateOrderCreation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const orderData = req.body;
    
    // Verify agent exists
    const agentResult = await req.firebaseService.getAgent(orderData.agent_id);
    if (!agentResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    if (!req.shopifyService) {
      return res.status(503).json({
        success: false,
        error: 'Shopify service not available'
      });
    }

    console.log('Creating order in Shopify:', {
      agentId: orderData.agent_id,
      customerEmail: orderData.customer.email,
      itemCount: orderData.line_items.length
    });

    // Create order in Shopify
    const shopifyResult = await req.shopifyService.createOrder(orderData);
    
    if (!shopifyResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create order in Shopify',
        details: shopifyResult.error
      });
    }

    // Save order to Firebase with agent assignment
    const firebaseResult = await req.firebaseService.saveShopifyOrder({
      ...shopifyResult.data,
      agentId: orderData.agent_id,
      assignedAt: new Date().toISOString(),
      assignedBy: 'system'
    });

    if (firebaseResult.success) {
      console.log('Order created successfully:', {
        shopifyOrderId: shopifyResult.data.id,
        orderNumber: shopifyResult.data.orderNumber,
        agentId: orderData.agent_id
      });
    }

    res.status(201).json({
      success: true,
      data: {
        shopifyOrder: shopifyResult.data,
        firebaseResult: firebaseResult
      },
      message: 'Order created successfully in Shopify and assigned to agent'
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: error.message
    });
  }
});
*/

// TEST endpoint to verify deployment
router.get('/test-deployment', async (req, res) => {
  res.json({
    success: true,
    message: 'New deployment working',
    timestamp: new Date().toISOString()
  });
});

// TEST POST endpoint
router.post('/test-post', async (req, res) => {
  res.json({
    success: true,
    message: 'POST route test successful',
    body: req.body
  });
});

export default router;