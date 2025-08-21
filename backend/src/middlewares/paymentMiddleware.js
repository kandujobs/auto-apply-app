const PaymentService = require('../services/paymentService');

function checkPaymentService(req, res, next) {
  if (!PaymentService.isAvailable()) {
    return res.status(503).json({
      error: true,
      message: 'Payment service is not available'
    });
  }
  next();
}

module.exports = { checkPaymentService };
