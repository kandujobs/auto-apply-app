# Railway Deployment Guide

## 🚀 Deploying the Refactored Backend to Railway

Your backend has been successfully refactored into a scalable, modular structure. Here's how to deploy it to Railway:

### Option 1: Using Railway CLI (Recommended)

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Deploy the application**:
   ```bash
   railway up
   ```

### Option 2: Using the Deployment Script

Run the provided deployment script:
```bash
./deploy-railway.sh
```

### Option 3: Manual Deployment via Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Create a new project or select existing project
3. Connect your GitHub repository
4. Railway will automatically detect the Dockerfile and deploy

## 📁 Project Structure

The refactored backend now has this structure:
```
backend/
├── src/
│   ├── app.js                 # Main Express application
│   ├── server.js              # Server entry point
│   ├── config/
│   │   ├── database.js        # Database configuration
│   │   └── websocket.js       # WebSocket configuration
│   ├── routes/
│   │   ├── healthRoutes.js    # Health check endpoints
│   │   ├── jobRoutes.js       # Job-related endpoints
│   │   ├── paymentRoutes.js   # Payment endpoints
│   │   └── sessionRoutes.js   # Session management
│   ├── services/
│   │   ├── paymentService.js  # Payment business logic
│   │   └── sessionManager.js  # Session management
│   ├── middlewares/
│   │   ├── errorHandler.js    # Global error handling
│   │   └── paymentMiddleware.js # Payment checks
│   └── utils/
│       ├── logger.js          # Logging utilities
│       └── validation.js      # Validation utilities
├── package.json
└── README.md
```

## 🔧 Configuration Files

- **Dockerfile**: Updated for the new structure
- **railway.json**: Updated health check path to `/api/health`
- **railway.toml**: Updated port to 3001

## 🌐 API Endpoints

Once deployed, your API will be available at:
- **Health Check**: `https://your-railway-url.railway.app/api/health`
- **Base URL**: `https://your-railway-url.railway.app/`

### Available Endpoints:
- `GET /api/health` - Health check
- `GET /api/test-connectivity` - Connectivity test
- `POST /api/session/start` - Start session
- `POST /api/job-search` - Job search
- `POST /api/auto-apply` - Auto apply
- `GET /api/payment/subscription-plans` - Get plans
- And many more...

## 🔑 Environment Variables

Make sure these are set in Railway:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PORT` (Railway sets this automatically)

## ✅ Benefits of the New Structure

1. **Scalability**: Modular architecture supports growth
2. **Maintainability**: Clear separation of concerns
3. **Testability**: Each module can be tested independently
4. **Team Development**: Multiple developers can work on different modules
5. **Error Handling**: Centralized error management
6. **Logging**: Structured logging system

## 🧪 Testing the Deployment

After deployment, test the endpoints:
```bash
# Health check
curl https://your-railway-url.railway.app/api/health

# Test connectivity
curl https://your-railway-url.railway.app/api/test-connectivity
```

## 🐛 Troubleshooting

If deployment fails:
1. Check Railway logs for errors
2. Verify environment variables are set
3. Ensure all dependencies are in package.json
4. Check that the Dockerfile is correct

## 📞 Support

If you encounter issues:
1. Check the Railway logs
2. Verify the server starts locally first
3. Ensure all environment variables are configured
