// Commission Calculation Routes
import express from 'express';
import CommissionService from '../services/commission.js';

const router = express.Router();

// GET /api/commission/calculate/:orderId/:agentId - Calculate commission for order
router.get('/calculate/:orderId/:agentId', async (req, res) => {
  try {
    const { orderId, agentId } = req.params;
    
    console.log(`📊 Calculating commission for order ${orderId} -> agent ${agentId}`);
    
    // Get order from Shopify service
    const shopifyService = req.shopifyService;
    const orderResult = await shopifyService.getOrder(orderId);
    
    if (!orderResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Calculate commission
    const commissionService = new CommissionService(req.firebaseService);
    const result = await commissionService.calculateOrderCommission(
      orderResult.data,
      agentId
    );
    
    if (result.success) {
      console.log(`✅ Commission calculated: RM ${result.commission.totalCommission}`);
      
      res.json({
        success: true,
        commission: result.commission,
        message: `Commission calculated: RM ${result.commission.totalCommission}`
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Commission calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate commission'
    });
  }
});

// POST /api/commission/calculate - Calculate commission with order data
router.post('/calculate', async (req, res) => {
  try {
    const { order, agentId } = req.body;
    
    if (!order || !agentId) {
      return res.status(400).json({
        success: false,
        error: 'Order data and agent ID are required'
      });
    }
    
    console.log(`📊 Calculating commission for order ${order.id || 'unknown'} -> agent ${agentId}`);
    
    // Calculate commission
    const commissionService = new CommissionService(req.firebaseService);
    const result = await commissionService.calculateOrderCommission(order, agentId);
    
    if (result.success) {
      console.log(`✅ Commission calculated: RM ${result.commission.totalCommission}`);
      
      res.json({
        success: true,
        commission: result.commission,
        message: `Commission calculated: RM ${result.commission.totalCommission}`
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Commission calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate commission'
    });
  }
});

// GET /api/commission/agent/:agentId - Get agent's commission history
router.get('/agent/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;
    
    console.log(`📊 Getting commission history for agent ${agentId}`);
    
    let start = null;
    let end = null;
    
    if (startDate) start = new Date(startDate);
    if (endDate) end = new Date(endDate);
    
    // Get commissions from Firebase
    const result = await req.firebaseService.getAgentCommissions(agentId, start, end);
    
    if (result.success) {
      const commissions = result.data.slice(0, parseInt(limit));
      
      // Calculate totals
      const totalCommission = commissions.reduce((sum, comm) => sum + (comm.totalCommission || 0), 0);
      const totalOrders = commissions.length;
      const averageCommission = totalOrders > 0 ? totalCommission / totalOrders : 0;
      
      res.json({
        success: true,
        data: {
          commissions,
          summary: {
            totalCommission: parseFloat(totalCommission.toFixed(2)),
            totalOrders,
            averageCommission: parseFloat(averageCommission.toFixed(2)),
            period: {
              startDate: start?.toISOString() || null,
              endDate: end?.toISOString() || null
            }
          }
        }
      });
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('Get agent commissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get commission history'
    });
  }
});

// POST /api/commission/simulate - Simulate commission for demo orders
router.post('/simulate', async (req, res) => {
  try {
    const { agentId } = req.body;
    
    // Sample orders from your actual Shopify data
    const sampleOrders = [
      {
        id: '6940416376922',
        name: '#3122',
        total: 71.29,
        currency: 'MYR',
        customer: {
          fullName: 'J*y (jay_decade)',
          email: 'jay_decade.shopee@example.com'
        },
        lineItems: [
          {
            id: '19133572317274',
            title: 'Kurung Batik Alana & Kemeja Dm-Sedondon Moden-Satin Valentino-XS-5XL',
            quantity: 1,
            price: 88,
            vendor: 'DESA MURNI BATIK KILANG'
          }
        ],
        createdAt: new Date('2025-08-23T05:59:40.000Z'),
        financialStatus: 'paid'
      },
      {
        id: '6978250635354',
        name: '#TEST-BM',
        total: 95.00,
        currency: 'MYR',
        customer: {
          fullName: 'Ahmad Testing',
          email: 'ahmad@test.com'
        },
        lineItems: [
          {
            id: '19999999999999',
            title: 'ADAM TRADISIONAL K1 INDIGO - Baju Melayu Pesak Satin Paloma',
            quantity: 1,
            price: 95,
            vendor: 'DESA MURNI BATIK HQ'
          }
        ],
        createdAt: new Date(),
        financialStatus: 'paid'
      }
    ];
    
    const commissionService = new CommissionService(req.firebaseService);
    const results = [];
    
    for (const order of sampleOrders) {
      const result = await commissionService.calculateOrderCommission(order, agentId || 'AGT-001');
      if (result.success) {
        results.push(result.commission);
      }
    }
    
    const totalCommission = results.reduce((sum, comm) => sum + comm.totalCommission, 0);
    
    res.json({
      success: true,
      data: {
        commissions: results,
        summary: {
          totalOrders: results.length,
          totalCommission: parseFloat(totalCommission.toFixed(2)),
          averageCommission: parseFloat((totalCommission / results.length).toFixed(2))
        }
      },
      message: `Simulated ${results.length} commission calculations`
    });
    
  } catch (error) {
    console.error('Commission simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate commissions'
    });
  }
});

// GET /api/commission/rates - Get commission rate configuration
router.get('/rates', (req, res) => {
  const rates = {
    defaultRate: 0.05, // 5%
    productBonuses: {
      'Batik Fabric': 0.01,      // 1% bonus
      'Baju Melayu': 0.025,      // 2.5% bonus
      'Kurung Batik': 0.025,     // 2.5% bonus
      'Premium Cotton': 0.015,   // 1.5% bonus
      'Satin Valentino': 0.02,   // 2% bonus
      'Traditional Wear': 0.03,  // 3% bonus
      'Bulk Orders': 0.015       // 1.5% bonus
    },
    volumeTiers: [
      { minAmount: 10000, bonusRate: 0.02, description: 'RM10k+ = 2% bonus' },
      { minAmount: 5000, bonusRate: 0.015, description: 'RM5k+ = 1.5% bonus' },
      { minAmount: 2000, bonusRate: 0.01, description: 'RM2k+ = 1% bonus' },
      { minAmount: 1000, bonusRate: 0.005, description: 'RM1k+ = 0.5% bonus' }
    ]
  };
  
  res.json({
    success: true,
    data: rates,
    message: 'Commission rates configuration'
  });
});

export default router;