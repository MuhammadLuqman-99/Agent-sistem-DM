// Agent Management Routes
import express from 'express';
import { logAgentActivity, getAgentActivities, getAllAgents } from '../services/firebase.js';

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

// ADMIN ROUTES - Monitor and control agents

// GET /api/agents/admin/activities - Get all agent activities for admin monitoring
router.get('/admin/activities', async (req, res) => {
  try {
    const { agentId, limit = 100 } = req.query;
    const filters = { limit };
    
    if (agentId) filters.agentId = agentId;
    
    const result = await getAgentActivities(filters);
    res.json(result);
  } catch (error) {
    console.error('Get agent activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent activities',
      details: error.message
    });
  }
});

// GET /api/agents/admin/overview - Get admin overview of all agents
router.get('/admin/overview', async (req, res) => {
  try {
    // Get all agents
    const agentsResult = await getAllAgents();
    if (!agentsResult.success) {
      return res.status(500).json(agentsResult);
    }

    // Get recent activities for all agents
    const activitiesResult = await getAgentActivities({ limit: 50 });
    const activities = activitiesResult.success ? activitiesResult.data : [];

    // Get all orders to calculate agent performance
    const ordersResult = await req.firebaseService.getAllOrders(200);
    const orders = ordersResult.success ? ordersResult.data : [];

    // Calculate agent statistics
    const agentStats = {};
    
    // Initialize stats for each agent
    agentsResult.data.forEach(agent => {
      agentStats[agent.id] = {
        ...agent,
        totalOrders: 0,
        totalRevenue: 0,
        recentActivity: activities.filter(act => act.agentId === agent.id).slice(0, 5),
        status: agent.status || 'active',
        lastActivity: null
      };
    });

    // Calculate order statistics
    orders.forEach(order => {
      if (order.agentId && agentStats[order.agentId]) {
        agentStats[order.agentId].totalOrders++;
        agentStats[order.agentId].totalRevenue += order.total || 0;
      }
    });

    // Set last activity dates
    activities.forEach(activity => {
      if (agentStats[activity.agentId] && !agentStats[activity.agentId].lastActivity) {
        agentStats[activity.agentId].lastActivity = activity.timestamp;
      }
    });

    const overview = {
      totalAgents: agentsResult.data.length,
      activeAgents: Object.values(agentStats).filter(a => a.status === 'active').length,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
      agents: Object.values(agentStats),
      recentActivities: activities.slice(0, 20)
    };

    res.json({ success: true, data: overview });
  } catch (error) {
    console.error('Get admin overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin overview',
      details: error.message
    });
  }
});

// POST /api/agents/:id/admin/action - Admin actions on specific agent
router.post('/:id/admin/action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason, adminId } = req.body;

    const validActions = ['suspend', 'activate', 'reset-password', 'add-note'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Valid actions: ' + validActions.join(', ')
      });
    }

    // Log admin action
    await logAgentActivity(id, {
      type: `admin_${action}`,
      details: {
        adminId,
        action,
        reason,
        timestamp: new Date().toISOString()
      },
      status: 'admin_action'
    });

    // Perform the action based on type
    let updateResult = { success: true };
    
    if (action === 'suspend') {
      updateResult = await req.firebaseService.updateUser(id, {
        status: 'suspended',
        suspendedAt: new Date(),
        suspendedBy: adminId,
        suspendReason: reason
      });
    } else if (action === 'activate') {
      updateResult = await req.firebaseService.updateUser(id, {
        status: 'active',
        activatedAt: new Date(),
        activatedBy: adminId
      });
    }

    if (updateResult.success) {
      res.json({
        success: true,
        message: `Agent ${action} completed successfully`,
        action,
        agentId: id
      });
    } else {
      res.status(500).json(updateResult);
    }

  } catch (error) {
    console.error('Admin action error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform admin action',
      details: error.message
    });
  }
});

export default router;