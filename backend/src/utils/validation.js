class Validation {
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidUserId(userId) {
    return userId && typeof userId === 'string' && userId.length > 0;
  }

  static isValidJobId(jobId) {
    return jobId && (typeof jobId === 'string' || typeof jobId === 'number');
  }

  static isValidSearchParams(params) {
    return params && typeof params === 'object';
  }

  static validateRequiredFields(data, requiredFields) {
    const missing = [];
    
    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0) {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    return true;
  }

  static validateJobApplicationData(data) {
    const required = ['userId', 'jobId'];
    return this.validateRequiredFields(data, required);
  }

  static validateSessionData(data) {
    const required = ['userId'];
    return this.validateRequiredFields(data, required);
  }

  static validatePaymentData(data) {
    const required = ['email'];
    return this.validateRequiredFields(data, required);
  }
}

module.exports = Validation;
