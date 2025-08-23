# AgentOS API Server

Express.js API server with Shopify integration for AgentOS.

## Quick Start

### 1. Install Dependencies
```bash
cd api
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Update `.env` with your Shopify store details:
- `SHOPIFY_SHOP_NAME`: Your development store name (without .myshopify.com)
- `SHOPIFY_ACCESS_TOKEN`: Private app access token from Shopify
- `SHOPIFY_WEBHOOK_SECRET`: Webhook secret for verification

### 3. Setup Firebase Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file as `../config/firebase-service-account.json`
4. Update `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env`

### 4. Run the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will run on: http://localhost:3001

## API Endpoints

### Health Check
- `GET /health` - Server health status
- `GET /api` - API documentation

### Shopify Integration
- `GET /api/shopify/orders` - Fetch orders from Shopify
- `GET /api/shopify/orders/:id` - Get specific order
- `POST /api/shopify/orders/:id/assign` - Assign order to agent
- `GET /api/shopify/products` - Fetch products
- `GET /api/shopify/customers` - Fetch customers
- `POST /api/shopify/sync/orders` - Manual sync orders

### Agent Management
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `GET /api/agents/:id/orders` - Get agent's orders
- `GET /api/agents/:id/commissions` - Get agent's commissions
- `GET /api/agents/:id/stats` - Get agent statistics

### Order Management
- `GET /api/orders` - List all orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:id/assign` - Assign order to agent

### Webhooks
- `POST /webhooks/shopify/orders/create` - New order webhook
- `POST /webhooks/shopify/orders/updated` - Order updated webhook
- `POST /webhooks/shopify/orders/paid` - Order paid webhook
- `POST /webhooks/shopify/orders/fulfilled` - Order fulfilled webhook

## Testing the Integration

### 1. Test API Connection
```bash
curl http://localhost:3001/health
```

### 2. Test Shopify Connection
```bash
curl http://localhost:3001/api/shopify/orders
```

### 3. Create Test Order in Shopify
1. Go to your Shopify development store admin
2. Create a test order
3. Check if it appears in the API response

### 4. Test Order Assignment
```bash
curl -X POST http://localhost:3001/api/shopify/orders/ORDER_ID/assign \
  -H "Content-Type: application/json" \
  -d '{"agentId": "AGENT_USER_ID"}'
```

## Setting Up Shopify Private App

### 1. Create Private App
1. Go to your Shopify store admin
2. Navigate to "Apps" → "Apps and sales channel settings"
3. Click "Develop apps for your store"
4. Click "Create app"
5. Name it "AgentOS Integration"

### 2. Configure App Permissions
In the app configuration, add these scopes:
- `read_orders` - Read orders
- `write_orders` - Modify orders
- `read_products` - Read products
- `read_customers` - Read customers
- `read_inventory` - Read inventory levels

### 3. Generate Access Token
1. Click "Install app"
2. Copy the "Admin API access token"
3. Use this token as `SHOPIFY_ACCESS_TOKEN` in your `.env` file

### 4. Setup Webhooks (Optional for Development)
```bash
# Setup webhooks automatically
npm run setup-webhooks
```

## Development Workflow

### 1. Start Both Servers
```bash
# Terminal 1: Start API server
cd api
npm run dev

# Terminal 2: Start frontend (Live Server or similar)
# Open pages/agent-dashboard.html in browser
```

### 2. Test Flow
1. Open agent dashboard
2. Click "Sync from Shopify" button
3. See orders appear in the table
4. Assign orders to agents
5. Check Firebase for saved data

## Production Deployment

### 1. Environment Variables
Update production `.env` with:
- Real Shopify store credentials
- Production Firebase project
- Production webhook URLs
- Strong JWT secrets

### 2. Deploy Options
- **Google Cloud Run**: Containerized deployment
- **Firebase Functions**: Serverless deployment
- **Heroku**: Quick deployment
- **VPS/Dedicated**: Full control

### 3. Webhook Setup
Update webhooks to point to production URLs:
```
https://your-domain.com/webhooks/shopify/orders/create
https://your-domain.com/webhooks/shopify/orders/updated
etc.
```

## Monitoring

### Logs
All operations are logged with timestamps and details.

### Health Monitoring
- `GET /health` endpoint for uptime monitoring
- Firebase connection status
- Shopify API connection status

### Error Handling
- Comprehensive error logging
- Graceful API fallbacks
- Webhook retry mechanisms

## Security

### API Security
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Input validation
- Webhook signature verification

### Data Security
- Firebase Admin SDK for secure database access
- Environment variables for secrets
- No sensitive data in logs

## Troubleshooting

### Common Issues

**Connection Refused**
- Check if server is running on correct port
- Verify firewall settings

**Shopify API Errors**
- Verify shop name and access token
- Check API permissions/scopes
- Monitor rate limits

**Firebase Errors**
- Verify service account file path
- Check Firebase project permissions
- Ensure Firestore is enabled

**CORS Issues**
- Update `FRONTEND_URL` in `.env`
- Check browser developer tools
- Verify API server is running

### Debug Mode
Set `NODE_ENV=development` for detailed error messages.

### Logs Location
Check console output for real-time logs and error details.