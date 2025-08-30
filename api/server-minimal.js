// Minimal AgentOS API Server - for debugging Railway deployment
import express from 'express';
import cors from 'cors';

// Only import orders route for now
import orderRoutes from './src/routes/orders.js';

const app = express();
const PORT = process.env.PORT || 3003;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Minimal AgentOS API server is running'
  });
});

// Orders routes
app.use('/api/orders', orderRoutes);

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