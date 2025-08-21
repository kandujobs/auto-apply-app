const PaymentService = require('../services/paymentService');

function checkPaymentService(req, res, next) {
  // Bypass payment checks in development mode for testing
  if (process.env.NODE_ENV === 'development' || process.env.BYPASS_PAYMENT_CHECKS === 'true') {
    console.log('🔓 Bypassing payment checks for development/testing');
    return next();
  }
  
  if (!PaymentService.isAvailable()) {
    return res.status(503).json({
      error: true,
      message: 'Payment service is not available'
    });
  }
  next();
}

module.exports = { checkPaymentService };
