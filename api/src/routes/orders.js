// Order Management Routes - Updated for Railway deployment
import express from 'express';

const router = express.Router();

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
    const orderData = req.body;
    
    // Basic validation
    if (!orderData.customer || !orderData.customer.email) {
      return res.status(400).json({
        success: false,
        error: 'Customer email is required'
      });
    }
    
    if (!orderData.line_items || orderData.line_items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one line item is required'
      });
    }
    
    if (!orderData.agent_id) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required'
      });
    }
    
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

// TEST endpoint to verify deployment
router.get('/test-deployment', async (req, res) => {
  res.json({
    success: true,
    message: 'New deployment working',
    timestamp: new Date().toISOString()
  });
});

export default router;