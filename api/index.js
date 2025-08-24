// Firebase Functions Entry Point
import { https } from 'firebase-functions';
import app from './server.js';

// Export the Express app as a Firebase Function
export const api = https.onRequest(app);

// Export individual endpoints for better performance
export const health = https.onRequest((req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'production',
    version: '1.0.0'
  });
});

export const shopify = https.onRequest((req, res) => {
  // Handle Shopify-specific requests
  res.json({
    name: 'Shopify API',
    status: 'Available',
    endpoints: ['/orders', '/products', '/customers']
  });
});

export const agents = https.onRequest((req, res) => {
  // Handle agent management requests
  res.json({
    name: 'Agent Management API',
    status: 'Available',
    endpoints: ['/list', '/create', '/update', '/delete']
  });
});
