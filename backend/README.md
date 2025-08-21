# Kandu Auto-Apply Backend

A scalable, well-structured Node.js backend for the Kandu auto-apply job application system.

## 🏗️ Architecture

This backend follows a modular, scalable architecture with clear separation of concerns:

```
backend/
├── src/
│   ├── app.js                 # Main Express application setup
│   ├── server.js              # Server entry point
│   ├── config/
│   │   ├── database.js        # Database configuration (Supabase)
│   │   └── websocket.js       # WebSocket configuration
│   ├── controllers/           # Route handlers (to be implemented)
│   ├── routes/
│   │   ├── healthRoutes.js    # Health check endpoints
│   │   ├── jobRoutes.js       # Job-related endpoints
│   │   ├── paymentRoutes.js   # Payment/Stripe endpoints
│   │   └── sessionRoutes.js   # Session management endpoints
│   ├── services/
│   │   ├── paymentService.js  # Payment business logic
│   │   └── sessionManager.js  # Session management logic
│   ├── middlewares/
│   │   ├── errorHandler.js    # Global error handling
│   │   └── paymentMiddleware.js # Payment service checks
│   ├── utils/
│   │   ├── logger.js          # Logging utilities
│   │   └── validation.js      # Validation utilities
│   └── models/                # Data models (to be implemented)
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project
- Stripe account (for payments)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.backend .env
```

3. Configure your `.env` file with:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
PORT=3001
NODE_ENV=development
```

4. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Health & Status
- `GET /api/health` - Health check
- `GET /api/test-connectivity` - Connectivity test

### Sessions
- `POST /api/session/start` - Start a new session
- `POST /api/session/end` - End a session
- `POST /api/session/stop` - Stop a session (alias for end)
- `GET /api/session/status/:userId` - Get session status
- `POST /api/session/status` - Update session status

### Jobs
- `POST /api/job-search` - Update job search preferences
- `POST /api/job-details` - Get job details
- `POST /api/auto-apply` - Start auto-apply process
- `POST /api/fetch-jobs` - Fetch jobs from LinkedIn
- `POST /api/easy-apply-jobs` - Get easy apply jobs
- `POST /api/apply-job` - Apply to specific job
- `GET /api/application-status` - Get application status
- `POST /api/answer-question` - Answer application questions

### Payments
- `POST /api/payment/create-customer` - Create Stripe customer
- `POST /api/payment/create-subscription` - Create subscription
- `POST /api/payment/create-trial-checkout` - Create trial checkout
- `GET /api/payment/subscription-plans` - Get subscription plans
- `GET /api/payment/user-access/:userId` - Get user access level
- `POST /api/payment/webhook` - Stripe webhook handler

## 🔧 Key Features

### Session Management
- Automatic session cleanup (5-minute inactivity timeout)
- WebSocket-based real-time communication
- Browser instance management
- Application progress tracking

### Job Processing
- LinkedIn job fetching
- Easy apply automation
- Application question handling
- Progress tracking and notifications

### Payment Integration
- Stripe subscription management
- Free trial handling
- Webhook processing
- User access control

### Error Handling
- Centralized error handling middleware
- Consistent error responses
- Development vs production error details

## 🧪 Development

### Adding New Routes

1. Create a new route file in `src/routes/`
2. Import and use it in `src/app.js`
3. Follow the existing pattern for error handling and validation

### Adding New Services

1. Create a new service file in `src/services/`
2. Export the service class/object
3. Import and use in routes or other services

### Adding New Middleware

1. Create a new middleware file in `src/middlewares/`
2. Export the middleware function
3. Apply it in `src/app.js` or specific routes

## 📊 Monitoring

The application includes comprehensive logging:
- Request/response logging
- Error tracking
- Session management logs
- Payment processing logs

Use the Logger utility for consistent logging:
```javascript
const Logger = require('./utils/logger');

Logger.info('Application started');
Logger.success('User logged in', { userId: '123' });
Logger.warn('Rate limit approaching');
Logger.error('Database connection failed', error);
```

## 🔒 Security

- CORS configuration
- Input validation
- Error message sanitization (production)
- Secure WebSocket connections
- Payment webhook signature verification

## 🚀 Deployment

The application is containerized with Docker and can be deployed to:
- Railway
- Heroku
- AWS
- Google Cloud Platform

### Docker Deployment

```bash
docker build -t kandu-backend .
docker run -p 3001:3001 kandu-backend
```

## 🤝 Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include validation for all inputs
4. Add logging for important operations
5. Test thoroughly before submitting

## 📝 License

MIT License - see LICENSE file for details
