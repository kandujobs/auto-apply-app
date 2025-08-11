// Utility to fetch jobs from JSearch (RapidAPI)
// Usage: fetchJobs('software engineer', 'new york')

const JSEARCH_API_KEY = '210b47ff0dmshd49a972f44b2139p103b2ajsn6be6d010d68a'; // Updated key
const JSEARCH_API_HOST = 'jsearch.p.rapidapi.com';

function summarizeDescription(desc: string): string {
  if (!desc) return 'Not available';
  // Split by sentence-ending punctuation
  const sentences = desc.match(/[^.!?\n]+[.!?\n]+/g) || [desc];
  return sentences.slice(0, 4).join(' ').replace(/\s+/g, ' ').trim();
}

function extractSalaryFromText(text: string): string | null {
  if (!text) return null;
  // Look for patterns like $XX,XXX - $YY,YYY or $XX/hr or $XX/hour
  const rangeMatch = text.match(/\$\d{2,3}(,\d{3})?(?:\s*-\s*\$\d{2,3}(,\d{3})?)?/);
  if (rangeMatch) return rangeMatch[0];
  const perHourMatch = text.match(/\$\d{2,3}(?:\.\d{2})?\s*\/?\s*(hr|hour)/i);
  if (perHourMatch) return perHourMatch[0] + ' /hour';
  return null;
}

function addSalaryLabel(salary: string): string {
  // Remove commas and $ for parsing
  const numbers = salary.match(/\$?([\d,]+(\.\d+)?)/g);
  if (!numbers) return salary;
  // Get all numbers, flatten, and parse
  const values = numbers.map(n => parseFloat(n.replace(/[^\d.]/g, ''))).filter(Boolean);
  if (values.length === 0) return salary;
  // Use the lowest value for heuristics
  const min = Math.min(...values);
  if (/hour|hr/i.test(salary)) return salary.includes('/') ? salary : salary + ' /hour';
  if (/year|yr|annual/i.test(salary)) return salary.includes('/') ? salary : salary + ' /year';
  if (/month|mo/i.test(salary)) return salary.includes('/') ? salary : salary + ' /month';
  if (min < 200) return salary + ' /hour';
  if (min > 10000) return salary + ' /year';
  if (min > 2000 && min <= 10000) return salary + ' /month';
  return salary;
}

// Helper to fetch salary estimate from JSearch API
async function fetchSalaryEstimate(title: string, location: string): Promise<string | null> {
  try {
    const url = `https://jsearch.p.rapidapi.com/salary-estimate?job_title=${encodeURIComponent(title)}&location=${encodeURIComponent(location)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': JSEARCH_API_KEY,
        'X-RapidAPI-Host': JSEARCH_API_HOST,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.estimated_salary) {
      return data.estimated_salary;
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function mapJSearchJobToJob(j: any, location: string): Promise<import('../types/Job').Job> {
  // Salary logic: prefer job_salary, then salary, then min/max, then extract from description
  let salary = 'Not available';
  if (j.job_salary) {
    salary = j.job_salary;
  } else if (j.salary) {
    salary = j.salary;
  } else if (j.salary_min && j.salary_max) {
    salary = `${j.salary_currency || j.job_salary_currency || ''} ${j.salary_min} - ${j.salary_max}`.trim();
  } else if (j.job_salary_min && j.job_salary_max) {
    salary = `${j.job_salary_currency || ''} ${j.job_salary_min} - ${j.job_salary_max}`.trim();
  } else {
    // Try to extract from description
    const desc = j.job_description || j.description || '';
    const extracted = extractSalaryFromText(desc);
    if (extracted) salary = extracted;
  }
  // If still not available, use salary estimate endpoint
  if (salary === 'Not available') {
    const estimate = await fetchSalaryEstimate(j.job_title || j.title || '', location);
    if (estimate) salary = estimate;
  }
  if (salary !== 'Not available') {
    salary = addSalaryLabel(salary);
  }

  // Tags logic: combine job_tags, tags, job_category
  let tags: string[] = [];
  if (Array.isArray(j.job_tags)) tags = tags.concat(j.job_tags);
  if (Array.isArray(j.tags)) tags = tags.concat(j.tags);
  if (Array.isArray(j.job_category)) tags = tags.concat(j.job_category);
  tags = tags.filter(Boolean).map(tag => typeof tag === 'string' ? tag : String(tag));
  if (tags.length === 0) tags = ['Not available'];

  // Description: summarize
  const description = summarizeDescription(j.job_description || j.description || 'Not available');

  // Requirements: limit to 3
  let requirements = j.job_highlights?.Qualifications || j.job_requirements || [];
  if (!Array.isArray(requirements)) requirements = [requirements];
  requirements = requirements.filter(Boolean).slice(0, 3);
  if (requirements.length === 0) requirements = ['Not available'];

  // Benefits: limit to 3
  let benefits = j.job_highlights?.Benefits || j.job_benefits || [];
  if (!Array.isArray(benefits)) benefits = [benefits];
  benefits = benefits.filter(Boolean).slice(0, 3);
  if (benefits.length === 0) benefits = ['Not available'];

  return {
    id: j.job_id || j.id || Math.random().toString(),
    title: j.job_title || j.title || 'Not available',
    company: j.employer_name || j.company || 'Not available',
    salary,
    location: (j.job_city && j.job_state ? `${j.job_city}, ${j.job_state}` : (j.job_location || j.location || 'Not available')),
    tags,
    requirements,
    benefits,
    connections: [], // JSearch does not provide connections
    fitScore: Math.floor(Math.random() * 21) + 70, // Random fit score 70-90 for demo
    description,
    appliedDate: new Date(),
    lat: j.job_latitude || 0,
    lng: j.job_longitude || 0,
    url: j.job_apply_link || j.url || '',
    additionalQuestions: [],
    source: 'External API' // Add source information
  };
}

export async function fetchJobs(query: string, location: string, limit: number = 20) {
  // Use dynamic query and location
  console.log('[fetchJobs] Query:', query, 'Location:', location, 'Limit:', limit);
  
  // Try different location formats for better API results
  const locationFormats = [];
  
  if (location.toLowerCase().includes('new york')) {
    locationFormats.push('New York, NY, USA');
    locationFormats.push('New York, NY');
    locationFormats.push('Manhattan, NY');
    locationFormats.push('Brooklyn, NY');
  } else if (location && !location.includes(',')) {
    locationFormats.push(`${location}, USA`);
    locationFormats.push(location);
  } else {
    locationFormats.push(location);
  }
  
  // JSearch API returns 20 jobs per page, so calculate num_pages
  const jobsPerPage = 20;
  const num_pages = Math.ceil(limit / jobsPerPage);
  
  // Try each location format until we get results
  for (const formattedLocation of locationFormats) {
    try {
      const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(formattedLocation)}&page=1&num_pages=${num_pages}`;
      
      console.log('[fetchJobs] Trying location format:', formattedLocation);
      console.log('[fetchJobs] Making API request to:', url);
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': JSEARCH_API_KEY,
          'X-RapidAPI-Host': JSEARCH_API_HOST,
        },
      });
      
      if (!res.ok) {
        console.error('[fetchJobs] API error for location', formattedLocation, ':', res.status, res.statusText);
        continue; // Try next location format
      }
      
      const data = await res.json();
      console.log('[fetchJobs] RAW API response for', formattedLocation, ':', data);
      
      if (!data.data || data.data.length === 0) {
        console.warn('[fetchJobs] No jobs found for location:', formattedLocation);
        continue; // Try next location format
      }
      
      // Map jobs with salary fallback
      const jobs = await Promise.all((data.data || []).map((j: any) => mapJSearchJobToJob(j, location)));
      console.log('[fetchJobs] Mapped jobs for', formattedLocation, ':', jobs.length);
      
      if (jobs.length > 0) {
        console.log('[fetchJobs] Successfully found jobs using location format:', formattedLocation);
        return jobs.slice(0, limit);
      }
    } catch (error) {
      console.error('[fetchJobs] Error trying location format', formattedLocation, ':', error);
      continue; // Try next location format
    }
  }
  
  console.warn('[fetchJobs] No jobs found with any location format');
  return [];
} 