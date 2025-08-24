# AgentOS API Server

A comprehensive API server for AgentOS with Shopify integration, Firebase backend, and commission management.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project
- Shopify store with API access

### Installation

1. **Clone and install dependencies:**
```bash
cd api
npm install
```

2. **Environment Configuration:**
```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your actual values
nano .env
```

3. **Required Environment Variables:**
```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
# OR
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Shopify Configuration
SHOPIFY_SHOP_NAME=your-shop-name
SHOPIFY_ACCESS_TOKEN=your-access-token
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret

# API Rate Limiting
API_RATE_LIMIT=100
```

4. **Firebase Setup:**
```bash
# Download your Firebase service account key
# Place it in config/firebase-service-account.json
# OR set FIREBASE_SERVICE_ACCOUNT environment variable
```

5. **Start the server:**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🔧 Available Scripts

- `npm run dev` - Start with nodemon (development)
- `npm start` - Start production server
- `npm run setup-webhooks` - Configure Shopify webhooks
- `npm run setup-firebase` - Verify Firebase configuration
- `npm run feature-check` - Test all integrations

## 📡 API Endpoints

### Health & Status
- `GET /health` - Server health check
- `GET /api` - API documentation

### Shopify Integration
- `GET /api/shopify/orders` - Fetch orders
- `GET /api/shopify/products` - Fetch products
- `GET /api/shopify/customers` - Fetch customers
- `POST /api/shopify/sync/orders` - Sync orders

### Agent Management
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `GET /api/agents/:id/orders` - Get agent orders
- `GET /api/agents/:id/commissions` - Get agent commissions

### Order Management
- `GET /api/orders` - List all orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:id/assign` - Assign order to agent

### Commission System
- `GET /api/commission/calculate/:orderId/:agentId` - Calculate commission
- `POST /api/commission/calculate` - Calculate with order data
- `GET /api/commission/agent/:agentId` - Agent commission history

### Webhooks
- `POST /webhooks/shopify/orders/create` - New order webhook
- `POST /webhooks/shopify/orders/updated` - Order update webhook
- `POST /webhooks/shopify/customers/create` - New customer webhook

## 🛡️ Security Features

- **Rate Limiting**: Configurable API rate limiting
- **CORS Protection**: Configurable cross-origin policies
- **Helmet Security**: Security headers and protections
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses (no stack traces in production)

## 🔍 Troubleshooting

### Common Issues

1. **Firebase Connection Failed:**
   - Check service account credentials
   - Verify Firebase project configuration
   - Check network connectivity

2. **Shopify API Errors:**
   - Verify shop name and access token
   - Check API permissions
   - Verify webhook secret

3. **Port Already in Use:**
   - Change PORT in .env file
   - Kill existing process: `lsof -ti:3001 | xargs kill`

4. **Missing Dependencies:**
   - Run `npm install` again
   - Clear node_modules: `rm -rf node_modules && npm install`

### Debug Mode

Enable detailed logging:
```bash
NODE_ENV=development npm run dev
```

### Health Check

Test server status:
```bash
curl http://localhost:3001/health
```

## 🚀 Deployment

### Railway (Recommended)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway up
```

### Docker
```bash
# Build image
docker build -t agentos-api .

# Run container
docker run -p 3001:3001 --env-file .env agentos-api
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use strong webhook secrets
- Configure proper CORS origins
- Set appropriate rate limits

## 📊 Monitoring

- Health endpoint: `/health`
- API documentation: `/api`
- Request logging with Morgan
- Error tracking and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review error logs
3. Test with the feature-check script
4. Create an issue with detailed error information