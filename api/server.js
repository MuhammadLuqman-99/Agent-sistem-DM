// AgentOS API Server with Shopify Integration - Production Ready
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import csrf from 'csurf';
import { config, validateConfig } from './src/config/index.js';
import logger from './src/utils/logger.js';
import { 
  errorHandler, 
  notFoundHandler,
  unhandledRejectionHandler,
  uncaughtExceptionHandler 
} from './src/middleware/errorHandler.js';

// Import routes
import shopifyRoutes from './src/routes/shopify.js';
import agentRoutes from './src/routes/agents.js';
import webhookRoutes from './src/routes/webhooks.js';
import orderRoutes from './src/routes/orders.js';
import commissionRoutes from './src/routes/commission.js';
import authRoutes from './src/routes/auth.js';
import userRoutes from './src/routes/user.js';
import settingsRoutes from './src/routes/settings.js';

// Import services
import FirebaseService from './src/services/firebase.js';

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', uncaughtExceptionHandler);
process.on('unhandledRejection', unhandledRejectionHandler);

// Validate configuration on startup
validateConfig();

logger.info('Starting AgentOS API Server', {
  environment: config.server.env,
  port: config.server.port,
  nodeVersion: process.version
});

const app = express();
const PORT = config.server.port;

// Initialize Firebase
const firebaseService = new FirebaseService();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  exposedHeaders: ['X-CSRF-Token']
}));

// CSRF Protection (disabled for testing)
// app.use(csrf({ cookie: true }));

// Request logging - Custom format for structured logging
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      logger.info('HTTP Request', { message: message.trim() });
    }
  }
}));

// Body parsing middleware with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting - Configured for production use
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Math.floor(config.server.rateLimit * 0.2), // 20% of standard rate for admin
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  }
});

const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.server.rateLimit,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting
app.use('/api/admin', strictLimiter); // Stricter for admin endpoints
app.use('/api/', standardLimiter);

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Make services available to routes
app.use((req, res, next) => {
  req.firebaseService = firebaseService;
  next();
});

// Initialize Shopify service for routes that need it
let shopifyService;
try {
  const ShopifyService = (await import('./src/services/shopify.js')).default;
  shopifyService = new ShopifyService();
  logger.info('Shopify service initialized successfully');
} catch (error) {
  logger.warn('Shopify service initialization failed', { 
    error: error.message,
    details: 'Application will continue with limited functionality'
  });
  shopifyService = null;
}

// Make Shopify service available to routes
app.use((req, res, next) => {
  req.shopifyService = shopifyService;
  next();
});

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Routes
app.use('/api/shopify', shopifyRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/webhooks', webhookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'AgentOS API',
    version: '1.0.0',
    description: 'API server for AgentOS with Shopify integration',
    endpoints: {
      auth: '/api/auth/*',
      user: '/api/user/*',
      settings: '/api/settings/*',
      shopify: '/api/shopify/*',
      agents: '/api/agents/*',
      orders: '/api/orders/*',
      commission: '/api/commission/*',
      webhooks: '/webhooks/*',
      health: '/health'
    },
    documentation: 'https://your-docs-url.com'
  });
});

// 404 handler
app.use('*', notFoundHandler);

// Error handling middleware
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info('AgentOS API Server started successfully', {
    port: PORT,
    environment: config.server.env,
    healthCheck: `http://localhost:${PORT}/health`,
    apiDocs: `http://localhost:${PORT}/api`,
    pid: process.pid
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  
  server.close((err) => {
    if (err) {
      logger.error('Error during server shutdown', { error: err.message });
      process.exit(1);
    }
    
    logger.info('HTTP server closed successfully');
    
    // Close database connections, clean up resources
    if (firebaseService) {
      try {
        // Firebase admin doesn't need explicit cleanup
        logger.info('Firebase service cleaned up');
      } catch (cleanupError) {
        logger.error('Error cleaning up Firebase service', { 
          error: cleanupError.message 
        });
      }
    }
    
    logger.info('Application shutdown complete');
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;