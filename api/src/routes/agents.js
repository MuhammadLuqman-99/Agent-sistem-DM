// Agent Management Routes
import express from 'express';

const router = express.Router();

// GET /api/agents - Get all agents
router.get('/', async (req, res) => {
  try {
    const result = await req.firebaseService.getAllAgents();
    res.json(result);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents',
      details: error.message
    });
  }
});

// GET /api/agents/:id - Get specific agent
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.firebaseService.getAgent(id);
    res.json(result);
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent',
      details: error.message
    });
  }
});

// GET /api/agents/:id/orders - Get agent's orders
router.get('/:id/orders', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    
    const result = await req.firebaseService.getAgentOrders(id, parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Get agent orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent orders',
      details: error.message
    });
  }
});

// GET /api/agents/:id/commissions - Get agent's commissions
router.get('/:id/commissions', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    let start = null, end = null;
    
    if (startDate) start = new Date(startDate);
    if (endDate) end = new Date(endDate);
    
    const result = await req.firebaseService.getAgentCommissions(id, start, end);
    res.json(result);
  } catch (error) {
    console.error('Get agent commissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent commissions',
      details: error.message
    });
  }
});

// GET /api/agents/:id/stats - Get agent statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.firebaseService.getAgentStats(id);
    res.json(result);
  } catch (error) {
    console.error('Get agent stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent stats',
      details: error.message
    });
  }
});

// PUT /api/agents/:id - Update agent
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated via API
    const { password, role, ...safeUpdateData } = updateData;
    
    const result = await req.firebaseService.updateUser(id, safeUpdateData);
    res.json(result);
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update agent',
      details: error.message
    });
  }
});

export default router;