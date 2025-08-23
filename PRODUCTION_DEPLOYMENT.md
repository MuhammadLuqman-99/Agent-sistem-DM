# 🚀 AgentOS Production Deployment Guide

## 📋 Overview
Deploy your complete AgentOS system to production hosting dengan HTTPS support untuk Shopify webhooks.

## 🎯 Deployment Options (Recommended Order)

### 1. 🔥 **Railway** (Recommended - Easiest)
- ✅ Automatic HTTPS
- ✅ Environment variables
- ✅ Git deployment
- ✅ Database support
- ✅ Free tier available

### 2. 🌐 **Render** (Good alternative)
- ✅ Free tier with HTTPS
- ✅ Auto-deploy from Git
- ✅ Environment variables
- ✅ Good performance

### 3. ☁️ **Vercel** (Frontend + Serverless)
- ✅ Perfect for Next.js
- ✅ Serverless functions
- ✅ Automatic HTTPS
- ✅ Global CDN

---

## 🚂 Option 1: Railway Deployment (Recommended)

### Step 1: Prepare for Deployment

1. **Create Production Package.json Scripts**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'No build step required'",
    "postinstall": "echo 'Installation complete'"
  }
}
```

2. **Create Railway Configuration**
```toml
# railway.toml
[build]
  builder = "NIXPACKS"

[deploy]
  startCommand = "npm start"
  healthcheckPath = "/health"
  healthcheckTimeout = 300
  restartPolicyType = "ON_FAILURE"
  restartPolicyMaxRetries = 3

[variables]
  NODE_ENV = "production"
  PORT = "3000"
```

### Step 2: Deploy to Railway

1. **Sign Up & Connect Git**
   ```bash
   # Go to: https://railway.app/
   # Sign up with GitHub
   # Connect your repository
   ```

2. **Configure Environment Variables**
   ```env
   NODE_ENV=production
   PORT=3000
   
   # Shopify Configuration
   SHOPIFY_SHOP_NAME=e0xnhm-py
   SHOPIFY_ACCESS_TOKEN=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
   SHOPIFY_WEBHOOK_SECRET=e80cd884da2ae2b8a1dfb5e419c3a2cea7febb6a55d5bf8bb2417ca67d1eab3e
   
   # API Configuration
   JWT_SECRET=your_production_jwt_secret_change_this_to_something_secure
   API_RATE_LIMIT=100
   FRONTEND_URL=https://your-app-name.up.railway.app
   WEBHOOK_BASE_URL=https://your-app-name.up.railway.app
   
   # Firebase (if using)
   FIREBASE_SERVICE_ACCOUNT_PATH=../config/firebase-service-account.json
   
   # Logging
   LOG_LEVEL=info
   ```

3. **Deploy Commands**
   ```bash
   # Install Railway CLI (optional)
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway link
   railway up
   ```

### Step 3: Configure Domain & HTTPS

Railway provides automatic HTTPS at: `https://your-app-name.up.railway.app`

---

## 🌐 Option 2: Render Deployment

### Step 1: Prepare Render Build

1. **Create render.yaml**
```yaml
services:
  - type: web
    name: agentos-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

### Step 2: Deploy to Render

1. **Go to Render Dashboard**
   ```bash
   # https://render.com/
   # Connect GitHub repository
   # Select Node.js service
   ```

2. **Configure Build Settings**
   ```
   Build Command: npm install
   Start Command: npm start
   Environment: Node.js
   Node Version: 20
   ```

3. **Add Environment Variables** (same as Railway above)

---

## ☁️ Option 3: Vercel Deployment

### Step 1: Configure for Vercel

1. **Create vercel.json**
```json
{
  "version": 2,
  "name": "agentos-api",
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

2. **Install Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 🔧 Post-Deployment Configuration

### Step 1: Update Shopify Webhooks

Once deployed, update your webhook URLs:

```bash
# Get your production URL
PRODUCTION_URL="https://your-app-name.up.railway.app"

# Update webhook script
node scripts/setup-webhooks.js
```

### Step 2: Test Production Deployment

```bash
# Health check
curl https://your-app-name.up.railway.app/health

# Test Shopify products
curl https://your-app-name.up.railway.app/api/shopify/products

# Test commission system
curl -X POST https://your-app-name.up.railway.app/api/commission/simulate \
  -H "Content-Type: application/json" \
  -d '{"agentId": "AGT-001"}'
```

### Step 3: Configure Custom Domain (Optional)

1. **Buy Domain** (e.g., `agentos-kilangbatik.com`)
2. **Add CNAME Record**
   ```
   CNAME www your-app-name.up.railway.app
   CNAME @ your-app-name.up.railway.app
   ```
3. **Update Environment Variables**
   ```env
   FRONTEND_URL=https://agentos-kilangbatik.com
   WEBHOOK_BASE_URL=https://agentos-kilangbatik.com
   ```

---

## 📊 Production Checklist

### ✅ Pre-Deployment
- [ ] Environment variables configured
- [ ] Service account secured (not in git)
- [ ] CORS settings updated for production domain
- [ ] Rate limiting configured
- [ ] Error logging enabled
- [ ] Health check endpoint working

### ✅ Post-Deployment  
- [ ] API server accessible via HTTPS
- [ ] Shopify products loading
- [ ] Commission calculation working
- [ ] Webhook endpoints responding
- [ ] Admin dashboard accessible
- [ ] Error monitoring setup

### ✅ Production Security
- [ ] HTTPS enabled (automatic with Railway/Render)
- [ ] Environment variables secured
- [ ] API rate limiting active
- [ ] CORS configured for your domain only
- [ ] Firebase security rules applied
- [ ] Service account permissions minimal

---

## 🔍 Monitoring & Maintenance

### Daily Checks
```bash
# Health check
curl https://your-domain.com/health

# Feature check (run locally, pointing to production)
REACT_APP_API_URL=https://your-domain.com node scripts/feature-check.js
```

### Weekly Tasks
- [ ] Review error logs
- [ ] Check commission calculations
- [ ] Monitor API performance
- [ ] Update dependencies if needed
- [ ] Backup Firebase data

### Monthly Tasks
- [ ] Security review
- [ ] Performance optimization
- [ ] Feature usage analysis
- [ ] Cost optimization
- [ ] System updates

---

## 🎯 Success Metrics

Your production system is successful when:

✅ **Uptime**: 99.9% availability  
✅ **Performance**: API responses < 500ms  
✅ **Orders**: Real-time processing from Shopify  
✅ **Commissions**: Accurate calculations  
✅ **Agents**: Can access dashboards  
✅ **Webhooks**: Working reliably  

---

## 🆘 Production Support

### Common Issues

**"503 Service Unavailable"**
- Check server logs in hosting platform
- Verify environment variables
- Check health endpoint

**"CORS Error in Frontend"**
- Update CORS settings in server.js
- Add production domain to allowed origins
- Check HTTPS vs HTTP mixing

**"Webhook Delivery Failed"**
- Verify HTTPS endpoint accessible
- Check webhook signature validation
- Review Shopify webhook logs

### Getting Help

1. **Check Logs**: Platform dashboard logs
2. **Health Endpoint**: `/health` for system status  
3. **Feature Check**: Run feature-check.js pointing to production
4. **Shopify Logs**: Check Partner Dashboard webhook logs

---

## 🎉 Deployment Complete!

After successful deployment:

1. ✅ **AgentOS API**: Running with HTTPS
2. ✅ **Shopify Integration**: Real-time webhooks working
3. ✅ **Commission System**: Calculating earnings automatically  
4. ✅ **Agent Dashboard**: Accessible to your team
5. ✅ **Admin Panel**: Full management capabilities

**Your enterprise batik management system is now live! 🚀**

Share the admin dashboard URL with your team:
`https://your-domain.com/pages/admin-dashboard.html`