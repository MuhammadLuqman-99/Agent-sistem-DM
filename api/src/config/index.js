// Configuration Management for Production
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validation helper
const requireEnvVar = (name, defaultValue = null) => {
  const value = process.env[name];
  if (!value && defaultValue === null) {
    console.error(`❌ Missing required environment variable: ${name}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  return value || defaultValue;
};

// Environment configuration
export const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 3001,
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.FRONTEND_URL || 'http://localhost:5000',
    rateLimit: parseInt(process.env.API_RATE_LIMIT) || 500,
    logLevel: process.env.LOG_LEVEL || 'info'
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || null
  },

  // Shopify Configuration
  shopify: {
    shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecret: process.env.SHOPIFY_API_SECRET,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET,
    apiVersion: '2023-10' // Latest stable version
  },

  // Firebase Configuration
  firebase: {
    projectId: requireEnvVar('FIREBASE_PROJECT_ID'),
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    clientId: process.env.FIREBASE_CLIENT_ID,
    clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL
  },

  // JWT Configuration
  jwt: {
    secret: requireEnvVar('JWT_SECRET', 'dev-jwt-secret-change-in-production'),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // Security Configuration
  security: {
    csrfSecret: requireEnvVar('CSRF_SECRET', 'dev-csrf-secret'),
    sessionSecret: requireEnvVar('SESSION_SECRET', 'dev-session-secret')
  },

  // Email Configuration
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },

  // Business Configuration
  business: {
    defaultCommissionRate: parseFloat(process.env.DEFAULT_COMMISSION_RATE) || 0.10,
    minimumOrderValue: parseFloat(process.env.MINIMUM_ORDER_VALUE) || 10.00,
    maximumOrderValue: parseFloat(process.env.MAXIMUM_ORDER_VALUE) || 50000.00,
    currency: 'MYR',
    timezone: 'Asia/Kuala_Lumpur'
  },

  // Feature Flags
  features: {
    enableWebhooks: process.env.ENABLE_WEBHOOKS === 'true',
    enableRealTimeSync: process.env.ENABLE_REAL_TIME_SYNC === 'true',
    enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    enableSmsNotifications: process.env.ENABLE_SMS_NOTIFICATIONS === 'true'
  },

  // Monitoring Configuration
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID
  }
};

// Validation function
export const validateConfig = () => {
  const errors = [];
  
  if (config.server.env === 'production') {
    // Critical checks for production
    if (!config.firebase.privateKey) {
      errors.push('FIREBASE_PRIVATE_KEY is required in production');
    }
    
    if (!config.firebase.clientEmail) {
      errors.push('FIREBASE_CLIENT_EMAIL is required in production');
    }
    
    if (config.jwt.secret === 'dev-jwt-secret-change-in-production') {
      errors.push('JWT_SECRET must be set in production');
    }
    
    if (!config.server.corsOrigin || config.server.corsOrigin.includes('localhost')) {
      errors.push('FRONTEND_URL must be set to production domain');
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    errors.forEach(error => console.error(`   ${error}`));
    
    if (config.server.env === 'production') {
      process.exit(1);
    }
  } else {
    console.log('✅ Configuration validation passed');
  }
};

// Export individual configs for backward compatibility
export const {
  server: serverConfig,
  shopify: shopifyConfig,
  firebase: firebaseConfig,
  jwt: jwtConfig,
  security: securityConfig,
  email: emailConfig,
  business: businessConfig,
  features: featureConfig,
  monitoring: monitoringConfig
} = config;

export default config;