import { chromium, Page } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://xipjxcktpzanmhfrkbrm.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Dm73I66zlS1RXYcde6QHdTQt32ARu00K9pXeFuIruJE';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface FetchedJob {
  id: string;
  jobTitle: string;
  companyName?: string;
  location?: string;
  jobUrl: string;
  easyApply: boolean;
  salary?: string;
  description?: string;
}

export interface UserSearchCriteria {
  userId: string;
  location: string;
  jobTitle: string;
}

/**
 * Get user search criteria from Supabase
 */
async function getUserSearchCriteria(userId: string): Promise<UserSearchCriteria | null> {
  try {
    console.log('🔍 Getting user search criteria for:', userId);
    
    // Get user profile (location)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('location')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      console.log('⚠️ Using fallback location: New York, NY');
    }

    // Experience table doesn't exist, using fallback job title
    console.log('⚠️ Experience table not available, using fallback job title: Software Engineer');

    const location = profile?.location || 'New York, NY';
    const jobTitle = 'Software Engineer';
    
    console.log('📋 User search criteria:', { location, jobTitle });
    
    return {
      userId,
      location,
      jobTitle
    };
  } catch (error) {
    console.error('Error getting user search criteria:', error);
    console.log('⚠️ Using fallback search criteria');
    return {
      userId,
      location: 'New York, NY',
      jobTitle: 'Software Engineer'
    };
  }
}

/**
 * Simple decryption function (matching the frontend encryption)
 */
function decrypt(encryptedText: string): string {
  const ENCRYPTION_KEY = 'your-secret-key-here'; // Must match frontend key
  
  try {
    // Decode from base64
    const decoded = Buffer.from(encryptedText, 'base64').toString();
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Get user's LinkedIn credentials from database
 */
async function getUserLinkedInCredentials(userId: string): Promise<{ email: string; password: string } | null> {
  try {
    // Fetch credentials from database
    const { data, error } = await supabase
      .from('linkedin_credentials')
      .select('email, password_encrypted')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching LinkedIn credentials:', error);
      return null;
    }

    // Decrypt password
    const decryptedPassword = decrypt(data.password_encrypted);
    
    return {
      email: data.email,
      password: decryptedPassword
    };
  } catch (error) {
    console.error('Error getting LinkedIn credentials:', error);
    return null;
  }
}

/**
 * Fetch jobs from LinkedIn with user-specific login
 */
async function fetchJobsFromLinkedIn(searchCriteria: UserSearchCriteria): Promise<FetchedJob[]> {
  console.log('🔍 This function is deprecated - job fetching is now handled by the backend session system');
  console.log('📋 Search criteria:', searchCriteria);
  
  // This function is no longer used since job fetching is handled by the backend
  // with the session browser and progress tracking
  throw new Error('Job fetching is now handled by the backend session system. Use the /api/fetch-jobs endpoint instead.');
}

/**
 * Extract jobs from the LinkedIn search results page
 */
async function extractJobsFromPage(page: Page, maxJobs: number): Promise<FetchedJob[]> {
  const fetchedJobs: FetchedJob[] = [];
  const seenJobs = new Set<string>(); // Track seen jobs to avoid duplicates

  try {
    // Scroll to load more content
    console.log('📜 Scrolling to load more content...');
    for (let i = 0; i < 5; i++) { // Increased from 3 to 5 scrolls
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait time
    }

    // Target the Job Cards using the correct selector
    console.log('🔍 Looking for job cards in the left-hand column...');
    
    // Wait for job cards to load
    console.log('⏳ Waiting for job cards to load...');
    await page.waitForSelector('a.job-card-container__link', { timeout: 30000 });
    
    // Extract all job information directly from cards without clicking
    const jobCards = await page.$$eval('a.job-card-container__link', (cards) =>
      cards.map((card) => {
        const title = card.querySelector('span[aria-hidden="true"] > strong')?.textContent?.trim() || '';
        const company = card.closest('[data-control-name]')?.querySelector('.artdeco-entity-lockup__subtitle')?.textContent?.trim() || '';
        
        // Extract location - try multiple selectors
        const cardContainer = card.closest('[data-control-name]') || card.parentElement;
        const locationElement = cardContainer?.querySelector('.artdeco-entity-lockup__caption') ||
                               cardContainer?.querySelector('.job-search-card__location') ||
                               cardContainer?.querySelector('[data-test-id="job-search-card-location"]') ||
                               cardContainer?.querySelector('.job-card-container__location') ||
                               cardContainer?.querySelector('.artdeco-entity-lockup_caption') ||
                               cardContainer?.querySelector('.tvm_text.tvm_text--low-emphasis') ||
                               cardContainer?.querySelector('.job-details-jobs-unified-top-card__tertiary-description-container .tvm_text') ||
                               cardContainer?.querySelector('.jobs-unified-top-card__tertiary-description-container .tvm_text') ||
                               cardContainer?.querySelector('[class*="tertiary-description"] .tvm_text') ||
                               cardContainer?.querySelector('.tvm_text--low-emphasis');
        let location = locationElement?.textContent?.trim() || '';
        
        // Debug: Log the raw location element if found
        if (locationElement) {
          console.log('📍 Found location element:', locationElement.outerHTML);
        }
        
        // Additional debugging for location extraction
        if (!location) {
          console.log('⚠️ No location found, trying alternative selectors...');
          // Try to find any text that looks like a location
          const allTextElements = cardContainer?.querySelectorAll('span, div') || [];
          for (const element of allTextElements) {
            const text = element.textContent?.trim() || '';
            if (text && (text.includes(',') || text.includes('Remote') || text.includes('Hybrid') || text.includes('On-site'))) {
              console.log(`📍 Potential location found: ${text}`);
              // Try to extract location from this text
              const extractedLocation = extractLocationFromText(text);
              if (extractedLocation) {
                location = extractedLocation;
                console.log(`📍 Extracted location from text: ${location}`);
                break;
              }
            }
          }
        }
        
        // Extract salary from the job card - try multiple selectors
        const salaryElement = cardContainer?.querySelector('.job-search-card__salary-info') || 
                             cardContainer?.querySelector('.job-card-container__salary-info') ||
                             cardContainer?.querySelector('[data-test-id="job-search-card-salary-info"]') ||
                             cardContainer?.querySelector('.artdeco-entity-lockup__metadata') ||
                             cardContainer?.querySelector('.job-search-card__metadata') ||
                             cardContainer?.querySelector('.job-card-container__metadata') ||
                             cardContainer?.querySelector('.job-search-card__salary') ||
                             cardContainer?.querySelector('.job-card-container__salary');
        const salary = salaryElement?.textContent?.trim() || '';
        
        // More comprehensive Easy Apply detection
        const cardText = card.textContent || '';
        const isEasyApply = cardText.includes('Easy Apply') || 
                           cardText.includes('Quick Apply') ||
                           card.querySelector('[aria-label*="Easy Apply"]') !== null ||
                           card.querySelector('[aria-label*="Quick Apply"]') !== null ||
                           card.querySelector('.jobs-apply-button') !== null;
        const jobUrl = card.getAttribute('href') || '';
        
        return { title, company, location, salary, description: '', isEasyApply, jobUrl };
      })
    );
    
    console.log(`🔍 Found ${jobCards.length} job cards to process`);
    
    // Debug: Log the first few job cards to see their content
    for (let i = 0; i < Math.min(3, jobCards.length); i++) {
      console.log(`🔍 Job ${i + 1}:`, {
        title: jobCards[i].title,
        company: jobCards[i].company,
        location: jobCards[i].location,
        salary: jobCards[i].salary,
        isEasyApply: jobCards[i].isEasyApply,
        hasEasyApplyText: jobCards[i].title.includes('Easy Apply') || jobCards[i].company.includes('Easy Apply') || jobCards[i].location.includes('Easy Apply')
      });
    }
    
    // Temporarily process all jobs to debug Easy Apply detection
    const jobsToProcess = jobCards; // Remove filter temporarily
    console.log(`🔍 Processing all ${jobsToProcess.length} jobs (Easy Apply filter disabled for debugging)`);
    
    for (let i = 0; i < Math.min(jobsToProcess.length, maxJobs); i++) {
      try {
        console.log(`🔍 Processing job ${i + 1}/${Math.min(jobsToProcess.length, maxJobs)}`);
        const jobInfo = jobsToProcess[i];
        
        console.log('Job Title:', jobInfo.title);
        console.log('Company:', jobInfo.company);
        console.log('Location:', jobInfo.location);
        console.log('Salary:', jobInfo.salary);
        console.log('Description length:', jobInfo.description?.length || 0);
        
        // Click on the job card to load detailed view
        const allJobCards = await page.$$('a.job-card-container__link');
        if (i < allJobCards.length) {
          await allJobCards[i].scrollIntoViewIfNeeded();
          await allJobCards[i].click();
          await page.waitForTimeout(3000); // wait longer for right-side pane to load
          
          // Wait for description content to load
          try {
            await page.waitForSelector('.jobs-description__content, .job-details-jobs-unified-top-card__job-description__content, .jobs-unified-top-card__job-description__content', { timeout: 5000 });
          } catch (error) {
            console.log('⚠️ Description content not found with specific selectors, proceeding anyway...');
          }

          // Extract job details from the right panel
          const jobDetails = await page.evaluate(() => {
            // Salary extraction function (must be defined inside evaluate)
            function extractSalaryFromText(text: string): string {
              if (!text) return '';
              
              // Common salary patterns
              const salaryPatterns = [
                // $X - $Y format
                /\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
                // $X to $Y format
                /\$[\d,]+(?:\s+to\s+\$[\d,]+)?(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
                // $X-$Y format (no spaces)
                /\$[\d,]+-[\d,]+(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
                // X-Y format with currency symbols
                /(?:USD|US\$|CAD|EUR|GBP)\s*[\d,]+(?:\s*-\s*[\d,]+)?(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
                // Salary ranges with words
                /(?:salary|compensation|pay)\s*(?:range|of)?\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
                // Annual salary patterns
                /(?:annual|yearly)\s*(?:salary|compensation)\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi,
                // Hourly rate patterns
                /(?:hourly|per\s+hour)\s*(?:rate|pay)\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi,
                // Base salary patterns
                /(?:base\s+)?salary\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi,
                // Compensation patterns
                /compensation\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi,
                // Benefits with salary
                /(?:benefits|package)\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi
              ];
              
              // Look for salary patterns in the text
              for (const pattern of salaryPatterns) {
                const matches = text.match(pattern);
                if (matches && matches.length > 0) {
                  // Clean up the salary text
                  let salary = matches[0].trim();
                  
                  // Remove common prefixes
                  salary = salary.replace(/^(salary|compensation|pay|annual|yearly|hourly|per\s+hour|base|benefits|package)\s*(?:range|of)?\s*:\s*/gi, '');
                  
                  // Ensure it starts with a currency symbol if it's a number
                  if (/^\d/.test(salary) && !salary.startsWith('$')) {
                    salary = '$' + salary;
                  }
                  
                  // Add period if missing
                  if (salary && !salary.endsWith('.') && !salary.endsWith('/') && !salary.endsWith('hr') && !salary.endsWith('year') && !salary.endsWith('month')) {
                    salary += '/year';
                  }
                  
                  return salary;
                }
              }
              
              // Look for specific salary keywords and extract nearby numbers
              const salaryKeywords = [
                'salary', 'compensation', 'pay', 'earnings', 'income', 'wage', 'rate', 'package'
              ];
              
              const lines = text.split('\n');
              for (const line of lines) {
                const lowerLine = line.toLowerCase();
                for (const keyword of salaryKeywords) {
                  if (lowerLine.includes(keyword)) {
                    // Look for dollar amounts in this line
                    const dollarMatches = line.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?/g);
                    if (dollarMatches && dollarMatches.length > 0) {
                      return dollarMatches[0].trim();
                    }
                    
                    // Look for numbers that might be salary
                    const numberMatches = line.match(/[\d,]+(?:\s*-\s*[\d,]+)?/g);
                    if (numberMatches && numberMatches.length > 0) {
                      const numbers = numberMatches.map((n: string) => n.replace(/,/g, '')).filter((n: string) => parseInt(n) > 1000);
                      if (numbers.length > 0) {
                        return '$' + numbers[0] + '/year';
                      }
                    }
                  }
                }
              }
              
              return '';
            }
            // Job title selectors
            const titleSelectors = [
              '.job-details-jobs-unified-top-card__job-title',
              '.jobs-unified-top-card__job-title',
              'h1',
              '.job-details-jobs-unified-top-card__job-title-link',
              '.jobs-unified-top-card__job-title-link'
            ];
            // Company name selectors
            const companySelectors = [
              '.job-details-jobs-unified-top-card__company-name',
              '.jobs-unified-top-card__company-name',
              '.job-details-jobs-unified-top-card__company-name-link',
              '.jobs-unified-top-card__company-name-link'
            ];
            // Location selectors
            const locationSelectors = [
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
              '.jobs-unified-top-card__tertiary-description-container span'
            ];
            // Salary selectors
            const salarySelectors = [
              '.job-details-jobs-unified-top-card__salary-info',
              '.jobs-unified-top-card__salary-info',
              '.job-details-jobs-unified-top-card__salary',
              '.job-details-jobs-unified-top-card__metadata',
              '.jobs-unified-top-card__metadata'
            ];
            // Description/Requirements selectors - more comprehensive list
            const descriptionSelectors = [
              '.job-details-jobs-unified-top-card__job-description',
              '.jobs-unified-top-card__job-description',
              '.job-details-jobs-unified-top-card__description',
              '.jobs-unified-top-card__description',
              '.job-details-jobs-unified-top-card__content',
              '.jobs-unified-top-card__content',
              '.job-details-jobs-unified-top-card__job-description__content',
              '.jobs-unified-top-card__job-description__content',
              // Additional selectors for job description
              '.jobs-description__content',
              '.job-details-jobs-unified-top-card__job-description__content',
              '.jobs-unified-top-card__job-description__content',
              '.jobs-description',
              '.job-details-jobs-unified-top-card__job-description__content',
              '.jobs-unified-top-card__job-description__content',
              // Generic content selectors
              '[data-test-id="job-description"]',
              '.jobs-description__content',
              '.job-details-jobs-unified-top-card__job-description__content',
              '.jobs-unified-top-card__job-description__content',
              // Fallback selectors
              '.jobs-description__content',
              '.job-details-jobs-unified-top-card__job-description__content',
              '.jobs-unified-top-card__job-description__content'
            ];
            // Easy Apply button selectors
            const easyApplySelectors = [
              'button[aria-label*="Easy Apply"]',
              'button[aria-label*="Quick Apply"]',
              '.jobs-apply-button',
              '.job-details-jobs-unified-top-card__container--two-pane button'
            ];
            let title = '';
            let company = '';
            let location = '';
            let salary = '';
            let description = '';
            let easyApply = false;
            // Extract job title
            for (const selector of titleSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                title = element.textContent?.trim() || '';
                if (title) break;
              }
            }
            // Extract company name
            for (const selector of companySelectors) {
              const element = document.querySelector(selector);
              if (element) {
                company = element.textContent?.trim() || '';
                if (company) break;
              }
            }
            // Extract location
            for (const selector of locationSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                location = element.textContent?.trim() || '';
                if (location) {
                  console.log(`📍 Found location with selector: ${selector}, value: ${location}`);
                  break;
                }
              }
            }
            
            // If no location found with selectors, try to extract from page text
            if (!location) {
              const pageText = document.body.textContent || '';
              const extractedLocation = extractLocationFromText(pageText);
              if (extractedLocation) {
                location = extractedLocation;
                console.log(`📍 Extracted location from page text: ${location}`);
              }
            }
            // Extract salary from dedicated salary elements first
            for (const selector of salarySelectors) {
              const element = document.querySelector(selector);
              if (element) {
                salary = element.textContent?.trim() || '';
                if (salary) {
                  console.log(`💰 Found salary with selector: ${selector}, value: ${salary}`);
                  break;
                }
              }
            }
            // Extract description/requirements with more comprehensive logic
            for (const selector of descriptionSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                const text = element.textContent?.trim() || '';
                if (text && text.length > 50) { // Only use if it's substantial content
                  description = text;
                  console.log(`📝 Found description with selector: ${selector}, length: ${text.length}`);
                  break;
                }
              }
            }
            
            // If no description found with selectors, try to find the largest text block
            if (!description || description.length < 50) {
              const allTextElements = document.querySelectorAll('p, div, span');
              let largestText = '';
              for (const element of allTextElements) {
                const text = element.textContent?.trim() || '';
                if (text.length > largestText.length && text.length > 100 && text.length < 10000) {
                  // Check if it looks like a job description (contains keywords)
                  const lowerText = text.toLowerCase();
                  if (lowerText.includes('responsibilities') || 
                      lowerText.includes('requirements') || 
                      lowerText.includes('qualifications') ||
                      lowerText.includes('experience') ||
                      lowerText.includes('skills') ||
                      lowerText.includes('about') ||
                      lowerText.includes('role') ||
                      lowerText.includes('position')) {
                    largestText = text;
                  }
                }
              }
              if (largestText) {
                description = largestText;
                console.log(`📝 Found description using fallback method, length: ${largestText.length}`);
              }
            }
            // If no salary found with selectors, try to extract from description
            if (!salary && description) {
              const extractedSalary = extractSalaryFromText(description);
              if (extractedSalary) {
                salary = extractedSalary;
                console.log(`💰 Extracted salary from description: ${salary}`);
              }
            }
            
            // Check for Easy Apply button
            for (const selector of easyApplySelectors) {
              const element = document.querySelector(selector);
              if (element) {
                easyApply = true;
                break;
              }
            }
            return {
              title,
              company,
              location,
              salary,
              description,
              easyApply,
              url: window.location.href
            };
          });
          console.log('📋 Job details extracted:', {
            title: jobDetails.title,
            company: jobDetails.company,
            location: jobDetails.location,
            salary: jobDetails.salary,
            description: jobDetails.description ? `${jobDetails.description.substring(0, 100)}...` : 'No description',
            descriptionLength: jobDetails.description?.length || 0,
            easyApply: jobDetails.easyApply,
            url: jobDetails.url
          });
          if (jobDetails.title) {
            // Create unique key for duplicate detection
            const jobKey = `${jobDetails.title}-${jobDetails.company || 'Unknown'}`.toLowerCase();
            if (seenJobs.has(jobKey)) {
              console.log(`⏭️ Skipping duplicate job: ${jobKey}`);
            } else {
                          // Clean up location data
            let cleanLocation = jobInfo.location || jobDetails.location || '';
            if (cleanLocation) {
              cleanLocation = extractLocationFromText(cleanLocation);
            }
            
            const job: FetchedJob = {
              id: `${jobKey}-${i}`,
              jobTitle: jobDetails.title,
              companyName: jobDetails.company,
              location: cleanLocation,
              jobUrl: jobDetails.url,
              easyApply: jobDetails.easyApply,
              salary: jobInfo.salary || jobDetails.salary, // Use salary from card first, fallback to detailed view
              description: jobDetails.description
            };
              console.log('✅ Created job object:', job);
              fetchedJobs.push(job);
              seenJobs.add(jobKey);
              if (fetchedJobs.length >= maxJobs) {
                console.log(`✅ Reached target of ${maxJobs} jobs`);
                break;
              }
            }
          } else {
            console.log('⚠️ No job title found for this card');
          }
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        console.log(`❌ Error processing job ${i + 1}:`, error);
        // Continue with the next job
      }
    }
  } catch (error) {
    console.error('❌ Error extracting jobs from page:', error);
  }
  return fetchedJobs;
}

/**
 * Extract salary from text using various patterns
 */
function extractSalaryFromText(text: string): string {
  if (!text) return '';
  
  // Common salary patterns
  const salaryPatterns = [
    // $X - $Y format
    /\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
    // $X to $Y format
    /\$[\d,]+(?:\s+to\s+\$[\d,]+)?(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
    // $X-$Y format (no spaces)
    /\$[\d,]+-[\d,]+(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
    // X-Y format with currency symbols
    /(?:USD|US\$|CAD|EUR|GBP)\s*[\d,]+(?:\s*-\s*[\d,]+)?(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
    // Salary ranges with words
    /(?:salary|compensation|pay)\s*(?:range|of)?\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
    // Annual salary patterns
    /(?:annual|yearly)\s*(?:salary|compensation)\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi,
    // Hourly rate patterns
    /(?:hourly|per\s+hour)\s*(?:rate|pay)\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi,
    // Base salary patterns
    /(?:base\s+)?salary\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi,
    // Compensation patterns
    /compensation\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi,
    // Benefits with salary
    /(?:benefits|package)\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi
  ];
  
  // Look for salary patterns in the text
  for (const pattern of salaryPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Clean up the salary text
      let salary = matches[0].trim();
      
      // Remove common prefixes
      salary = salary.replace(/^(salary|compensation|pay|annual|yearly|hourly|per\s+hour|base|benefits|package)\s*(?:range|of)?\s*:\s*/gi, '');
      
      // Ensure it starts with a currency symbol if it's a number
      if (/^\d/.test(salary) && !salary.startsWith('$')) {
        salary = '$' + salary;
      }
      
      // Add period if missing
      if (salary && !salary.endsWith('.') && !salary.endsWith('/') && !salary.endsWith('hr') && !salary.endsWith('year') && !salary.endsWith('month')) {
        salary += '/year';
      }
      
      return salary;
    }
  }
  
  // Look for specific salary keywords and extract nearby numbers
  const salaryKeywords = [
    'salary', 'compensation', 'pay', 'earnings', 'income', 'wage', 'rate', 'package'
  ];
  
  const lines = text.split('\n');
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    for (const keyword of salaryKeywords) {
      if (lowerLine.includes(keyword)) {
        // Look for dollar amounts in this line
        const dollarMatches = line.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?/g);
        if (dollarMatches && dollarMatches.length > 0) {
          return dollarMatches[0].trim();
        }
        
            // Look for numbers that might be salary
    const numberMatches = line.match(/[\d,]+(?:\s*-\s*[\d,]+)?/g);
    if (numberMatches && numberMatches.length > 0) {
      const numbers = numberMatches.map((n: string) => n.replace(/,/g, '')).filter((n: string) => parseInt(n) > 1000);
      if (numbers.length > 0) {
        return '$' + numbers[0] + '/year';
      }
    }
      }
    }
  }
  
  return '';
}

/**
 * Extract location from text using various patterns
 */
function extractLocationFromText(text: string): string {
  if (!text) return '';
  
  // Clean up the text first - remove metadata like timestamps and applicant counts
  let cleanText = text;
  
  // Remove common metadata patterns
  cleanText = cleanText.replace(/\s*·\s*\d+\s*(?:minutes?|hours?|days?)\s*ago\s*/gi, '');
  cleanText = cleanText.replace(/\s*·\s*(?:Over\s*)?\d+\s*applicants?\s*/gi, '');
  cleanText = cleanText.replace(/\s*·\s*Promoted\s*by\s*hirer\s*/gi, '');
  cleanText = cleanText.replace(/\s*·\s*(?:No response insights available yet|Actively reviewing applicants)\s*/gi, '');
  cleanText = cleanText.replace(/\s*·\s*Reposted\s*\d+\s*(?:minutes?|hours?|days?)\s*ago\s*/gi, '');
  
  // Common location patterns
  const locationPatterns = [
    // City, State patterns
    /([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*),\s*([A-Z]{2})/g,
    // Remote/Hybrid/On-site patterns
    /(Remote|Hybrid|On-site|Onsite)/gi,
    // Full state names
    /([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*),\s*(New York|California|Texas|Florida|Illinois|Pennsylvania|Ohio|Georgia|Michigan|North Carolina)/gi,
    // International locations
    /([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*),\s*([A-Z][a-z]+)/g,
    // Metropolitan areas
    /([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*\s*Metropolitan\s*Area)/gi,
    // United States
    /(United\s*States)/gi
  ];
  
  for (const pattern of locationPatterns) {
    const matches = cleanText.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0].trim();
    }
  }
  
  return '';
}

/**
 * Extract basic job information from card text
 */
function extractJobInfoFromCard(cardText: string): { title?: string; company?: string; location?: string; salary?: string } {
  const lines = cardText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let title = '';
  let company = '';
  let location = '';
  let salary = '';
  
  // Look for job title (usually the first prominent line)
  for (const line of lines) {
    if (line.length > 5 && line.length < 100) {
      const hasJobKeywords = [
        'software engineer', 'developer', 'engineer', 'manager', 'analyst',
        'specialist', 'coordinator', 'associate', 'lead', 'senior', 'junior'
      ].some(keyword => line.toLowerCase().includes(keyword));
      
      if (hasJobKeywords) {
        title = line;
        break;
      }
    }
  }
  
  // Look for company name
  for (const line of lines) {
    if (line.length > 2 && line.length < 50 && 
        !line.toLowerCase().includes('software') &&
        !line.toLowerCase().includes('engineer') && 
        !line.toLowerCase().includes('developer') &&
        !line.toLowerCase().includes('remote') &&
        !line.toLowerCase().includes('hybrid') &&
        !line.toLowerCase().includes('on-site') &&
        !line.toLowerCase().includes('united states')) {
      company = line;
      break;
    }
  }
  
  // Look for location
  for (const line of lines) {
    if (line.includes('Remote') || line.includes('Hybrid') || line.includes('On-site') ||
        line.includes('United States') || line.includes('New York')) {
      location = line;
      break;
    }
  }
  
  // Look for salary
  for (const line of lines) {
    if (line.includes('$') && (line.includes('/hr') || line.includes('/yr'))) {
      salary = line;
      break;
    }
  }
  
  return { title, company, location, salary };
}

/**
 * Validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Save fetched jobs to Supabase
 */
async function saveFetchedJobs(userId: string, jobs: FetchedJob[]): Promise<void> {
  try {
    console.log(`💾 Saving ${jobs.length} fetched jobs to database...`);
    
    // Validate user ID format
    if (!isValidUUID(userId)) {
      console.error(`❌ Invalid user ID format: ${userId}. Expected UUID format.`);
      throw new Error(`Invalid user ID format: ${userId}. Expected UUID format.`);
    }
    
    const jobsToInsert = jobs.map(job => ({
      user_id: userId,
      job_title: job.jobTitle,
      company_name: job.companyName,
      location: job.location,
      job_url: job.jobUrl,
      easy_apply: job.easyApply,
      salary: job.salary,
      description: job.description
    }));
    
    const { error } = await supabase
      .from('linkedin_fetched_jobs')
      .insert(jobsToInsert);
    
    if (error) {
      console.error('Error saving fetched jobs:', error);
      throw error;
    }
    
    console.log('✅ Successfully saved fetched jobs to database');
    
  } catch (error) {
    console.error('Error saving fetched jobs:', error);
    throw error;
  }
}

/**
 * Main function to fetch jobs for a user
 */
/**
 * Reset pagination state by clearing job swipes for a user
 */
export async function resetPaginationState(userId: string): Promise<void> {
  try {
    console.log('🔄 Resetting pagination state for user:', userId);
    
    // Delete all job swipes for this user
    const { error } = await supabase
      .from('job_swipes')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting pagination state:', error);
      // If table doesn't exist, that's okay - just log it
      if (error.code === '42P01') { // Table doesn't exist
        console.log('job_swipes table does not exist yet, skipping reset');
      }
    } else {
      console.log('✅ Successfully reset pagination state for user:', userId);
    }
    
    // Also clear localStorage pagination state
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentJobIndex');
      console.log('✅ Cleared localStorage currentJobIndex');
    }
  } catch (error) {
    console.error('Error in resetPaginationState:', error);
  }
}

export async function fetchJobsForUser(userId: string): Promise<void> {
  try {
    console.log(`🔍 Starting job fetch for user: ${userId}`);
    
    // Validate user ID format first
    if (!isValidUUID(userId)) {
      console.error(`❌ Invalid user ID format: ${userId}. Expected UUID format.`);
      throw new Error(`Invalid user ID format: ${userId}. Expected UUID format.`);
    }
    
    // Get user search criteria
    const searchCriteria = await getUserSearchCriteria(userId);
    if (!searchCriteria) {
      console.error('❌ Could not get user search criteria');
      return;
    }
    
    console.log('📋 User search criteria:', searchCriteria);
    
    // Fetch jobs from LinkedIn
    const jobs = await fetchJobsFromLinkedIn(searchCriteria);
    
    if (jobs.length > 0) {
      // Save jobs to database
      await saveFetchedJobs(userId, jobs);
      console.log(`✅ Successfully fetched and saved ${jobs.length} jobs for user ${userId}`);
    } else {
      console.log('⚠️ No jobs found for user');
    }
    
  } catch (error) {
    console.error('❌ Error fetching jobs for user:', error);
    // Don't re-throw the error to prevent unhandled promise rejection
    // Just log it and exit gracefully
    process.exit(1);
  }
}

// Export for use in other modules
export { getUserSearchCriteria, fetchJobsFromLinkedIn, saveFetchedJobs }; 