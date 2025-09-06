/**
 * LinkedIn CSS Selectors Utility
 * Centralized location for all LinkedIn selectors to make maintenance easier
 */

class LinkedInSelectors {
  /**
   * Get job title from a job card element
   * @param {Element} card - The job card element
   * @returns {string} - Job title or 'Not available'
   */
  static getJobTitle(card) {
    const selectors = [
      '.job-card-list__title',
      '.job-card-container__link .job-card-list__title',
      '[data-control-name="jobsearch_job_resultcard"] .job-card-list__title',
      '.job-card-container__link h3',
      '.job-card-container__link .job-card-list__title--new',
      '.job-card-container__link .job-card-list__title--new-design',
      '.job-card-container__link .job-card-list__title--new-design-v2'
    ];
    
    for (const selector of selectors) {
      const element = card.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    
    return 'Not available';
  }

  /**
   * Get company name from a job card element
   * @param {Element} card - The job card element
   * @returns {string} - Company name or 'Not available'
   */
  static getCompanyName(card) {
    const selectors = [
      '.job-card-container__company-name',
      '.job-card-container__link .job-card-container__company-name',
      '[data-control-name="jobsearch_job_resultcard"] .job-card-container__company-name',
      '.job-card-container__link .job-card-container__company-name--new',
      '.job-card-container__link h4',
      '.job-card-container__link .job-card-container__company-name--new-design',
      '.job-card-container__link .job-card-container__company-name--new-design-v2'
    ];
    
    for (const selector of selectors) {
      const element = card.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    
    return 'Not available';
  }

  /**
   * Get location from a job card element
   * @param {Element} card - The job card element
   * @returns {string} - Location or 'Not available'
   */
  static getLocation(card) {
    const selectors = [
      '.job-card-container__metadata-item',
      '.job-card-container__link .job-card-container__metadata-item',
      '[data-control-name="jobsearch_job_resultcard"] .job-card-container__metadata-item',
      '.job-card-container__link .job-card-container__metadata-item--new',
      '.job-card-container__link .job-card-container__metadata-wrapper .job-card-container__metadata-item',
      '.job-card-container__link .job-card-container__metadata-item--new-design',
      '.job-card-container__link .job-card-container__metadata-item--new-design-v2'
    ];
    
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
