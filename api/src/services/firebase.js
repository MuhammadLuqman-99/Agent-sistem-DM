// Firebase Service for AgentOS API
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

class FirebaseService {
  constructor() {
    this.db = null;
    this.auth = null;
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      if (this.initialized) return;

      // Initialize Firebase Admin
      if (!admin.apps.length) {
        let serviceAccount;
        
        // Try to load service account from individual environment variables
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
          serviceAccount = {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
          };
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
          try {
            const serviceAccountFile = await readFile(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8');
            serviceAccount = JSON.parse(serviceAccountFile);
          } catch (error) {
            console.warn('Service account file not found, using minimal config');
            serviceAccount = null;
          }
        }

        // For development, use minimal config if service account not available
        if (!serviceAccount) {
          console.log('Using minimal Firebase config for development');
          
          // Create a minimal service account config for development
          serviceAccount = {
            type: "service_account",
            project_id: "admin-agent-teamsale",
            private_key_id: "dev-key-id",
            private_key: "-----BEGIN PRIVATE KEY-----\nDEV_PLACEHOLDER_KEY\n-----END PRIVATE KEY-----\n",
            client_email: "firebase-adminsdk@admin-agent-teamsale.iam.gserviceaccount.com",
            client_id: "dev-client-id",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token"
          };
        }

        try {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://admin-agent-teamsale-default-rtdb.firebaseio.com`
          });
        } catch (error) {
          console.warn('Firebase Admin init failed, some features may not work:', error.message);
          // Initialize without Firebase for development/testing
          this.initialized = true;
          console.log('🟡 Running in Firebase-disabled mode for development');
          return;
        }
      }

      // Only initialize Firebase services if admin app exists
      if (admin.apps.length > 0) {
        this.db = admin.firestore();
        this.auth = admin.auth();
        console.log('✅ Firebase Admin initialized successfully');
      } else {
        this.db = null;
        this.auth = null;
        console.log('🟡 Firebase services disabled for development');
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Firebase initialization error:', error.message);
      throw error;
    }
  }

  // User Management
  async getUser(userId) {
    if (!this.db) {
      return { success: false, error: 'Firebase not initialized' };
    }
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        return { 
          success: true, 
          data: { id: userDoc.id, ...userDoc.data() }
        };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Get user error:', error);
      return { success: false, error: error.message };
    }
  }

  async getAgent(agentId) {
    try {
      const result = await this.getUser(agentId);
      if (result.success && result.data.role === 'agent') {
        return result;
      } else {
        return { success: false, error: 'Agent not found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getAllAgents() {
    try {
      const querySnapshot = await this.db
        .collection('users')
        .where('role', '==', 'agent')
        .get();
      
      const agents = [];
      querySnapshot.forEach((doc) => {
        agents.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: agents };
    } catch (error) {
      console.error('Get all agents error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUser(userId, userData) {
    try {
      await this.db.collection('users').doc(userId).update({
        ...userData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: error.message };
    }
  }

  // Shopify Orders Management
  async saveShopifyOrder(orderData) {
    try {
      const docRef = this.db.collection('shopify-orders').doc(orderData.id);
      await docRef.set({
        ...orderData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, id: orderData.id };
    } catch (error) {
      console.error('Save Shopify order error:', error);
      return { success: false, error: error.message };
    }
  }

  async getShopifyOrder(orderId) {
    try {
      const orderDoc = await this.db.collection('shopify-orders').doc(orderId).get();
      if (orderDoc.exists) {
        return { 
          success: true, 
          data: { id: orderDoc.id, ...orderDoc.data() }
        };
      } else {
        return { success: false, error: 'Order not found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async assignOrderToAgent(orderId, agentId, assignedBy = null) {
    try {
      const orderRef = this.db.collection('shopify-orders').doc(orderId);
      
      await orderRef.update({
        assignedAgent: agentId,
        assignedBy: assignedBy,
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'assigned',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Assign order error:', error);
      return { success: false, error: error.message };
    }
  }

  async getAgentOrders(agentId, limit = 50) {
    try {
      const querySnapshot = await this.db
        .collection('shopify-orders')
        .where('assignedAgent', '==', agentId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      const orders = [];
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: orders };
    } catch (error) {
      console.error('Get agent orders error:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllOrders(limit = 100) {
    try {
      const querySnapshot = await this.db
        .collection('shopify-orders')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      const orders = [];
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: orders };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Commission Management
  async saveCommission(commissionData) {
    try {
      const docRef = this.db.collection('commission-calculations').doc();
      await docRef.set({
        ...commissionData,
        id: docRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Save commission error:', error);
      return { success: false, error: error.message };
    }
  }

  async getAgentCommissions(agentId, startDate = null, endDate = null) {
    try {
      let query = this.db
        .collection('commission-calculations')
        .where('agentId', '==', agentId);

      if (startDate) {
        query = query.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startDate));
      }
      
      if (endDate) {
        query = query.where('createdAt', '<=', admin.firestore.Timestamp.fromDate(endDate));
      }
      
      const querySnapshot = await query
        .orderBy('createdAt', 'desc')
        .get();
      
      const commissions = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firestore timestamps to dates
        if (data.createdAt) data.createdAt = data.createdAt.toDate();
        if (data.updatedAt) data.updatedAt = data.updatedAt.toDate();
        if (data.payoutDate) data.payoutDate = data.payoutDate.toDate();
        
        commissions.push({ id: doc.id, ...data });
      });
      
      return { success: true, data: commissions };
    } catch (error) {
      console.error('Get agent commissions error:', error);
      return { success: false, error: error.message };
    }
  }

  // Analytics and Statistics
  async getAgentStats(agentId) {
    try {
      // Get agent orders
      const ordersResult = await this.getAgentOrders(agentId, 1000);
      if (!ordersResult.success) {
        throw new Error('Failed to fetch agent orders');
      }
      
      const orders = ordersResult.data;
      
      // Get agent commissions
      const commissionsResult = await this.getAgentCommissions(agentId);
      const commissions = commissionsResult.success ? commissionsResult.data : [];
      
      // Calculate statistics
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const totalCommissions = commissions.reduce((sum, comm) => sum + (comm.totalCommission || 0), 0);
      
      const completedOrders = orders.filter(order => 
        order.financialStatus === 'paid' && order.fulfillmentStatus === 'fulfilled'
      ).length;
      
      const pendingOrders = orders.filter(order => 
        order.financialStatus !== 'paid' || order.fulfillmentStatus !== 'fulfilled'
      ).length;
      
      const successRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0;
      
      // Monthly stats
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      });
      
      const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      
      return {
        success: true,
        data: {
          totalOrders,
          totalRevenue,
          totalCommissions,
          completedOrders,
          pendingOrders,
          successRate: parseFloat(successRate),
          monthlyOrders: monthlyOrders.length,
          monthlyRevenue,
          averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0
        }
      };
    } catch (error) {
      console.error('Get agent stats error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sync Logging
  async logSyncOperation(operation, status, details = {}, error = null) {
    try {
      await this.db.collection('sync-logs').add({
        operation,
        status,
        details,
        error,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (logError) {
      console.error('Failed to log sync operation:', logError);
    }
  }

  // Utility Methods
  async isHealthy() {
    try {
      // Test basic Firestore operation
      await this.db.collection('health-check').doc('test').set({
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, status: 'healthy' };
    } catch (error) {
      return { success: false, status: 'unhealthy', error: error.message };
    }
  }

  // Batch operations for better performance
  async batchSaveOrders(orders) {
    try {
      const batch = this.db.batch();
      
      orders.forEach(order => {
        const docRef = this.db.collection('shopify-orders').doc(order.id);
        batch.set(docRef, {
          ...order,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      
      return { success: true, count: orders.length };
    } catch (error) {
      console.error('Batch save orders error:', error);
      return { success: false, error: error.message };
    }
  }

  // User management functions
  async getUser(userId) {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return { success: false, error: 'User not found' };
      }
      
      return { success: true, data: userDoc.data() };
    } catch (error) {
      console.error('Get user error:', error);
      return { success: false, error: error.message };
    }
  }

  async createUser(userId, userData) {
    try {
      await this.db.collection('users').doc(userId).set({
        ...userData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, message: 'User created successfully' };
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUser(userId, updateData) {
    try {
      await this.db.collection('users').doc(userId).update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, message: 'User updated successfully' };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default FirebaseService;

// Named exports for backward compatibility
export const getUser = async (userId) => {
  const service = new FirebaseService();
  return await service.getUser(userId);
};

export const createUser = async (userId, userData) => {
  const service = new FirebaseService();
  return await service.createUser(userId, userData);
};

export const updateUser = async (userId, updateData) => {
  const service = new FirebaseService();
  return await service.updateUser(userId, updateData);
};

// Settings functions
export const getSettings = async (settingsId) => {
  const service = new FirebaseService();
  return await service.getUser(settingsId); // Reuse user methods for settings
};

export const createSettings = async (settingsId, settingsData) => {
  const service = new FirebaseService();
  return await service.createUser(settingsId, settingsData);
};

export const updateSettings = async (settingsId, updateData) => {
  const service = new FirebaseService();
  return await service.updateUser(settingsId, updateData);
};

// Admin monitoring functions
export const logAgentActivity = async (agentId, activity) => {
  const service = new FirebaseService();
  try {
    await service.db.collection('agent-activities').add({
      agentId,
      activity: activity.type,
      details: activity.details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: activity.status || 'completed'
    });
    return { success: true };
  } catch (error) {
    console.error('Log agent activity error:', error);
    return { success: false, error: error.message };
  }
};

export const getAgentActivities = async (filters = {}) => {
  const service = new FirebaseService();
  try {
    let query = service.db.collection('agent-activities').orderBy('timestamp', 'desc');
    
    if (filters.agentId) {
      query = query.where('agentId', '==', filters.agentId);
    }
    
    if (filters.limit) {
      query = query.limit(parseInt(filters.limit));
    }
    
    const snapshot = await query.get();
    const activities = [];
    
    snapshot.forEach(doc => {
      activities.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      });
    });
    
    return { success: true, data: activities };
  } catch (error) {
    console.error('Get agent activities error:', error);
    return { success: false, error: error.message };
  }
};

export const getAllAgents = async () => {
  const service = new FirebaseService();
  try {
    const snapshot = await service.db.collection('agents').get();
    const agents = [];
    
    snapshot.forEach(doc => {
      agents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, data: agents };
  } catch (error) {
    console.error('Get all agents error:', error);
    return { success: false, error: error.message };
  }
};