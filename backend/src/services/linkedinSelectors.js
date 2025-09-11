/**
 * LinkedIn CSS Selectors Utility
 * Centralized location for all LinkedIn selectors to make maintenance easier
 * Based on working selectors from old-server.js
 */

class LinkedInSelectors {
  /**
   * Get job title selectors array (from job cards)
   * @returns {Array<string>} - Array of CSS selectors for job title
   */
  static getJobTitleSelectors() {
    return [
      // Working selectors from old-server.js - THIS IS THE KEY!
      'span[aria-hidden="true"] > strong',
      
      // New artdeco selectors (most likely to work)
      '.artdeco-entity-lockup_title',
      '.artdeco-entity-lockup__title',
      
      // Legacy selectors
      '.job-card-list__title',
      '.job-card-container__link .job-card-list__title',
      '[data-control-name="jobsearch_job_resultcard"] .job-card-list__title',
      '.job-card-container__link h3',
      '.job-card-container__link .job-card-list__title--new',
      '.job-card-container__link .job-card-list__title--new-design',
      '.job-card-container__link .job-card-list__title--new-design-v2',
      
      // Generic selectors as fallback
      'h3',
      'h4',
      '.job-title',
      '.title',
      '[data-test-id="job-title"]',
      '.job-card-title',
      '.job-card__title',
      '.job-card-container__title',
      
      // Text-based selectors (look for elements with job-like text)
      'a[href*="/jobs/view/"] h3',
      'a[href*="/jobs/view/"] h4',
      'a[href*="/jobs/view/"] .title',
      'a[href*="/jobs/view/"] .job-title'
    ];
  }

  /**
   * Get job title from a job card element
   * @param {Element} card - The job card element
   * @returns {string} - Job title or 'Not available'
   */
  static getJobTitle(card) {
    const selectors = this.getJobTitleSelectors();
    
    for (const selector of selectors) {
      const element = card.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    
    return 'Not available';
  }

  /**
   * Get company name selectors array (from job cards)
   * @returns {Array<string>} - Array of CSS selectors for company name
   */
  static getCompanyNameSelectors() {
    return [
      // Working selectors from old-server.js
      '.artdeco-entity-lockup__subtitle',
      
      // Alternative artdeco selectors
      '.artdeco-entity-lockup_subtitle',
      
      // Job details page selectors from old-server.js (might work on cards too)
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__company-name-link',
      '.jobs-unified-top-card__company-name-link',
      
      // Legacy selectors
      '.job-card-container__company-name',
      '.job-card-container__link .job-card-container__company-name',
      '[data-control-name="jobsearch_job_resultcard"] .job-card-container__company-name',
      '.job-card-container__link .job-card-container__company-name--new',
      '.job-card-container__link h4',
      '.job-card-container__link .job-card-container__company-name--new-design',
      '.job-card-container__link .job-card-container__company-name--new-design-v2',
      
      // Generic selectors as fallback
      '.company-name',
      '.company',
      '.job-company',
      '.job-card-company',
      '.job-card__company',
      '.job-card-container__company',
      '[data-test-id="company-name"]',
      
      // Text-based selectors
      'a[href*="/jobs/view/"] .company',
      'a[href*="/jobs/view/"] .company-name',
      'a[href*="/jobs/view/"] .job-company'
    ];
  }
  /**
   * Get company name from a job card element
   * @param {Element} card - The job card element
   * @returns {string} - Company name or 'Not available'
   */
  static getCompanyName(card) {
    const selectors = this.getCompanyNameSelectors();
    
    for (const selector of selectors) {
      const element = card.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    
    return 'Not available';
  }

  /**
   * Get location selectors array (from job cards)
   * @returns {Array<string>} - Array of CSS selectors for location
   */
  static getLocationSelectors() {
    return [
      // Working selectors from old-server.js
      '.artdeco-entity-lockup__caption',
      
      // Alternative artdeco selectors
      '.artdeco-entity-lockup_caption',
      
      // Job details page selectors from old-server.js (might work on cards too)
      '.job-details-jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__location',
      '.jobs-unified-top-card__location',
      '.tvm_text.tvm_text--low-emphasis',
      '.job-details-jobs-unified-top-card__tertiary-description-container .tvm_text',
      '.jobs-unified-top-card__tertiary-description-container .tvm_text',
      '[class*="tertiary-description"] .tvm_text',
      '.tvm_text--low-emphasis',
      '.job-details-jobs-unified-top-card__tertiary-description-container span',
      '.jobs-unified-top-card__tertiary-description-container span',
      
      // Legacy selectors
      '.job-card-container__metadata-item',
      '.job-card-container__link .job-card-container__metadata-item',
      '[data-control-name="jobsearch_job_resultcard"] .job-card-container__metadata-item',
      '.job-card-container__link .job-card-container__metadata-item--new',
      '.job-card-container__link .job-card-container__metadata-wrapper .job-card-container__metadata-item',
      '.job-card-container__link .job-card-container__metadata-item--new-design',
      '.job-card-container__link .job-card-container__metadata-item--new-design-v2',
      
      // Generic selectors as fallback
      '.location',
      '.job-location',
      '.job-card-location',
      '.job-card__location',
      '.job-card-container__location',
      '[data-test-id="location"]',
      '.metadata-item',
      '.job-metadata',
      
      // Text-based selectors
      'a[href*="/jobs/view/"] .location',
      'a[href*="/jobs/view/"] .job-location',
      'a[href*="/jobs/view/"] .metadata-item'
    ];
  }
  /**
   * Get location from a job card element
   * @param {Element} card - The job card element
   * @returns {string} - Location or 'Not available'
   */
  static getLocation(card) {
    const selectors = this.getLocationSelectors();
    
    for (const selector of selectors) {
      const element = card.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    
    return 'Not available';
  }

  /**
   * Get job description from the job details page
   * @param {Document} document - The document object
   * @returns {string} - Job description or 'Not available'
   */
  static getJobDescription(document) {
    const selectors = [
      '.jobs-description__content',
      '.job-details-jobs-unified-top-card__job-description__content',
      '.jobs-unified-top-card__job-description__content',
      '.jobs-description-content__text',
      '.jobs-description-content__text--new',
      '.jobs-description-content__text--new-design'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    
    return 'Not available';
  }

  /**
   * Get salary selectors array (from job details page)
   * @returns {Array<string>} - Array of CSS selectors for salary information
   */
  static getSalarySelectors() {
    return [
      // Working selectors from old-server.js
      '.job-details-jobs-unified-top-card__salary-info',
      '.jobs-unified-top-card__salary-info',
      '.job-details-jobs-unified-top-card__salary',
      '.jobs-unified-top-card__salary',
      '.job-details-jobs-unified-top-card__metadata',
      '.jobs-unified-top-card__metadata',
      
      // Alternative selectors
      '.salary-info',
      '.job-salary',
      '.compensation',
      '.pay-range',
      '.salary-range',
      '[data-test-id="salary"]',
      '.job-details-salary',
      '.jobs-salary',
      
      // Text-based selectors
      'span:contains("$")',
      'div:contains("salary")',
      'div:contains("compensation")',
      'div:contains("pay")'
    ];
  }

  /**
   * Get salary from job details page
   * @param {Document} document - The document object
   * @returns {string} - Salary information or 'Not available'
   */
  static getSalary(document) {
    const selectors = this.getSalarySelectors();
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        const salaryText = element.textContent.trim();
        // Check if it looks like a salary (contains $ or numbers)
        if (salaryText.includes('$') || /\d/.test(salaryText)) {
          return salaryText;
        }
      }
    }
    
    // If no dedicated salary element found, try to extract from description
    return this.extractSalaryFromDescription(document);
  }

  /**
   * Extract salary from job description text
   * @param {Document} document - The document object
   * @returns {string} - Extracted salary or 'Not available'
   */
  static extractSalaryFromDescription(document) {
    const descriptionSelectors = [
      '.jobs-description__content',
      '.job-details-jobs-unified-top-card__job-description__content',
      '.jobs-unified-top-card__job-description__content',
      '.jobs-description-content__text'
    ];
    
    let description = '';
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        description = element.textContent.trim();
        break;
      }
    }
    
    if (!description) return 'Not available';
    
    // Common salary patterns from old-server.js
    const salaryPatterns = [
      /\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
      /\$[\d,]+(?:\s+to\s+\$[\d,]+)?(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
      /\$[\d,]+-[\d,]+(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
      /(?:USD|US\$|CAD|EUR|GBP)\s*[\d,]+(?:\s*-\s*[\d,]+)?(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
      /(?:salary|compensation|pay)\s*(?:range|of)?\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
      /(?:annual|yearly)\s*(?:salary|compensation)\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi,
      /(?:hourly|per\s+hour)\s*(?:rate|pay)\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi,
      /(?:base\s+)?salary\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi,
      /compensation\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi,
      /(?:benefits|package)\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi
    ];
    
    // Look for salary patterns in the text
    for (const pattern of salaryPatterns) {
      const matches = description.match(pattern);
      if (matches && matches.length > 0) {
        let salary = matches[0].trim();
        salary = salary.replace(/^(salary|compensation|pay|annual|yearly|hourly|per\s+hour|base|benefits|package)\s*(?:range|of)?\s*:\s*/gi, '');
        if (/^\d/.test(salary) && !salary.startsWith('$')) {
          salary = '$' + salary;
        }
        return salary;
      }
    }
    
    // Look for specific salary keywords and extract nearby numbers
    const salaryKeywords = ['salary', 'compensation', 'pay', 'earnings', 'income', 'wage', 'rate', 'package'];
    const lines = description.split('\n');
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      for (const keyword of salaryKeywords) {
        if (lowerLine.includes(keyword)) {
          const dollarMatches = line.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?/g);
          if (dollarMatches && dollarMatches.length > 0) {
            return dollarMatches[0].trim();
          }
        }
      }
    }
    
    return 'Not available';
  }

  /**
   * Format salary with proper units
   * @param {string} salary - Raw salary string
   * @returns {string} - Formatted salary string
   */
  static formatSalary(salary) {
    if (!salary || salary === 'Not available') return '';
    
    // Remove any existing units
    let cleanSalary = salary.replace(/\/(hour|hr|year|yr|month|mo|week|wk|day)/gi, '');
    
    // Extract the number
    const numberMatch = cleanSalary.match(/[\d,]+/);
    if (!numberMatch) return salary;
    
    const number = parseInt(numberMatch[0].replace(/,/g, ''));
    
    // Add appropriate unit based on number size
    if (number < 100) {
      return `$${number}/hour`;
    } else if (number < 10000) {
      return `$${number}/month`;
    } else {
      return `$${number}/year`;
    }
  }

  /**
   * Get Easy Apply button from the job details page
   * @param {Document} document - The document object
   * @returns {Element|null} - Easy Apply button element or null
   */
  static getEasyApplyButton(document) {
    // Try aria-label first (most reliable)
    const ariaButton = document.querySelector('button[aria-label="Easy Apply"]');
    if (ariaButton) return ariaButton;
    
    // Try text content search
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent && button.textContent.trim().includes('Easy Apply')) {
        return button;
      }
    }
    
    return null;
  }
}

module.exports = LinkedInSelectors;
