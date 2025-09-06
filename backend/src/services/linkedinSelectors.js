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
