// Shopify Webhooks Routes
import express from 'express';
import { createHmac } from 'crypto';
import ShopifyService from '../services/shopify.js';

const router = express.Router();

// Raw body middleware for webhook verification
router.use(express.raw({ type: 'application/json' }));

// Webhook verification middleware
const verifyWebhook = (req, res, next) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const body = req.body;
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

  if (!secret) {
    console.warn('SHOPIFY_WEBHOOK_SECRET not configured - skipping webhook verification');
    return next();
  }

  if (!hmac) {
    return res.status(401).json({
      success: false,
      error: 'Missing HMAC signature'
    });
  }

  const calculated_hmac = createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  if (calculated_hmac !== hmac) {
    return res.status(401).json({
      success: false,
      error: 'Invalid HMAC signature'
    });
  }

  // Parse JSON body after verification
  try {
    req.body = JSON.parse(body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON payload'
    });
  }
};

// POST /webhooks/shopify/orders/create - Handle new order creation
router.post('/shopify/orders/create', verifyWebhook, async (req, res) => {
  try {
    const order = req.body;
    console.log(`📦 New order webhook received: ${order.name} (${order.id})`);

    // Initialize Shopify service to transform order
    const shopifyService = new ShopifyService();
    const transformedOrder = shopifyService.transformOrder(order);

    // Save order to Firebase
    const saveResult = await req.firebaseService.saveShopifyOrder(transformedOrder);
    
    if (saveResult.success) {
      console.log(`✅ Order ${order.name} saved to Firebase`);

      // TODO: Auto-assign order to agent based on territory rules
      // TODO: Calculate commission
      // TODO: Send notification to assigned agent

      // Log sync operation
      await req.firebaseService.logSyncOperation(
        'order_created',
        'success',
        { orderId: order.id, orderNumber: order.order_number }
      );

      res.status(200).json({
        success: true,
        message: 'Order processed successfully'
      });
    } else {
      throw new Error(saveResult.error);
    }
  } catch (error) {
    console.error('Order creation webhook error:', error);
    
    // Log error
    await req.firebaseService.logSyncOperation(
      'order_created',
      'failed',
      { orderId: req.body?.id },
      error.message
    );

    res.status(500).json({
      success: false,
      error: 'Failed to process order webhook'
    });
  }
});

// POST /webhooks/shopify/orders/updated - Handle order updates
router.post('/shopify/orders/updated', verifyWebhook, async (req, res) => {
  try {
    const order = req.body;
    console.log(`📝 Order updated webhook received: ${order.name} (${order.id})`);

    // Initialize Shopify service to transform order
    const shopifyService = new ShopifyService();
    const transformedOrder = shopifyService.transformOrder(order);

    // Update order in Firebase
    const saveResult = await req.firebaseService.saveShopifyOrder(transformedOrder);
    
    if (saveResult.success) {
      console.log(`✅ Order ${order.name} updated in Firebase`);

      // Log sync operation
      await req.firebaseService.logSyncOperation(
        'order_updated',
        'success',
        { orderId: order.id, orderNumber: order.order_number }
      );

      res.status(200).json({
        success: true,
        message: 'Order update processed successfully'
      });
    } else {
      throw new Error(saveResult.error);
    }
  } catch (error) {
    console.error('Order update webhook error:', error);
    
    await req.firebaseService.logSyncOperation(
      'order_updated',
      'failed',
      { orderId: req.body?.id },
      error.message
    );

    res.status(500).json({
      success: false,
      error: 'Failed to process order update webhook'
    });
  }
});

// POST /webhooks/shopify/orders/paid - Handle order payment
router.post('/shopify/orders/paid', verifyWebhook, async (req, res) => {
  try {
    const order = req.body;
    console.log(`💰 Order paid webhook received: ${order.name} (${order.id})`);

    // Transform and save order
    const shopifyService = new ShopifyService();
    const transformedOrder = shopifyService.transformOrder(order);
    
    // Mark as paid and potentially trigger commission calculation
    transformedOrder.financialStatus = 'paid';
    transformedOrder.paidAt = new Date();

    const saveResult = await req.firebaseService.saveShopifyOrder(transformedOrder);
    
    if (saveResult.success) {
      console.log(`✅ Paid order ${order.name} processed`);

      // TODO: Trigger commission calculation if order is assigned to agent
      // TODO: Send payment notification to agent

      await req.firebaseService.logSyncOperation(
        'order_paid',
        'success',
        { orderId: order.id, orderNumber: order.order_number, amount: order.total_price }
      );

      res.status(200).json({
        success: true,
        message: 'Order payment processed successfully'
      });
    } else {
      throw new Error(saveResult.error);
    }
  } catch (error) {
    console.error('Order payment webhook error:', error);
    
    await req.firebaseService.logSyncOperation(
      'order_paid',
      'failed',
      { orderId: req.body?.id },
      error.message
    );

    res.status(500).json({
      success: false,
      error: 'Failed to process order payment webhook'
    });
  }
});

// POST /webhooks/shopify/orders/fulfilled - Handle order fulfillment
router.post('/shopify/orders/fulfilled', verifyWebhook, async (req, res) => {
  try {
    const fulfillment = req.body;
    const orderId = fulfillment.order_id;
    
    console.log(`📦 Order fulfilled webhook received for order: ${orderId}`);

    // Get existing order from Firebase
    const orderResult = await req.firebaseService.getShopifyOrder(orderId.toString());
    
    if (orderResult.success) {
      // Update fulfillment status
      const updatedOrder = {
        ...orderResult.data,
        fulfillmentStatus: 'fulfilled',
        fulfilledAt: new Date(fulfillment.created_at),
        trackingNumber: fulfillment.tracking_number,
        trackingCompany: fulfillment.tracking_company,
        trackingUrl: fulfillment.tracking_url
      };

      await req.firebaseService.saveShopifyOrder(updatedOrder);
      
      console.log(`✅ Order fulfillment updated for order ${orderId}`);

      // TODO: Send tracking information to customer and agent
      // TODO: Update commission status if applicable

      await req.firebaseService.logSyncOperation(
        'order_fulfilled',
        'success',
        { orderId: orderId, fulfillmentId: fulfillment.id }
      );

      res.status(200).json({
        success: true,
        message: 'Order fulfillment processed successfully'
      });
    } else {
      throw new Error(`Order ${orderId} not found in Firebase`);
    }
  } catch (error) {
    console.error('Order fulfillment webhook error:', error);
    
    await req.firebaseService.logSyncOperation(
      'order_fulfilled',
      'failed',
      { orderId: req.body?.order_id },
      error.message
    );

    res.status(500).json({
      success: false,
      error: 'Failed to process order fulfillment webhook'
    });
  }
});

// POST /webhooks/shopify/customers/create - Handle new customer creation
router.post('/shopify/customers/create', verifyWebhook, async (req, res) => {
  try {
    const customer = req.body;
    console.log(`👤 New customer webhook received: ${customer.email} (${customer.id})`);

    // Transform customer data
    const shopifyService = new ShopifyService();
    const transformedCustomer = shopifyService.transformCustomer(customer);

    // Save customer data to Firebase for agent reference
    // TODO: Implement saveShopifyCustomer method in FirebaseService
    console.log(`✅ Customer ${customer.email} processed`);

    await req.firebaseService.logSyncOperation(
      'customer_created',
      'success',
      { customerId: customer.id, email: customer.email }
    );

    res.status(200).json({
      success: true,
      message: 'Customer processed successfully'
    });
  } catch (error) {
    console.error('Customer creation webhook error:', error);
    
    await req.firebaseService.logSyncOperation(
      'customer_created',
      'failed',
      { customerId: req.body?.id },
      error.message
    );

    res.status(500).json({
      success: false,
      error: 'Failed to process customer webhook'
    });
  }
});

// GET /webhooks/test - Test webhook endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// POST /webhooks/test - Test webhook processing
router.post('/test', (req, res) => {
  console.log('Test webhook received:', req.body);
  
  res.json({
    success: true,
    message: 'Test webhook processed successfully',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

// Error handling for webhooks
router.use((error, req, res, next) => {
  console.error('Webhook error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Webhook processing failed',
    timestamp: new Date().toISOString()
  });
});

export default router;