// Minimal AgentOS API Server - for debugging Railway deployment
import express from 'express';
import cors from 'cors';

// Import essential routes
import orderRoutes from './src/routes/orders.js';
import shopifyRoutes from './src/routes/shopify.js';

// Import services
import FirebaseService from './src/services/firebase.js';

const app = express();
const PORT = process.env.PORT || 3003;

// Basic middleware
app.use(cors());
app.use(express.json());

// Initialize services
const firebaseService = new FirebaseService();

// Initialize Shopify service
let shopifyService;
try {
  const ShopifyService = (await import('./src/services/shopify.js')).default;
  shopifyService = new ShopifyService();
  console.log('✅ Shopify service initialized');
} catch (error) {
  console.warn('⚠️ Shopify service initialization failed:', error.message);
  shopifyService = null;
}

// Make services available to routes
app.use((req, res, next) => {
  req.firebaseService = firebaseService;
  req.shopifyService = shopifyService;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Minimal AgentOS API server is running'
  });
});

// Essential routes
app.use('/api/orders', orderRoutes);
app.use('/api/shopify', shopifyRoutes);

// Basic 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Minimal AgentOS API Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;