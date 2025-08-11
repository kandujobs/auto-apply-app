export interface Job {
  id: string;
  title: string;
  company: string;
  salary: string;
  location: string;
  tags: string[];
  requirements: string[];
  benefits: string[];
  connections: string[];
  fitScore: number;
  description: string;
  status?: 'saved' | 'applied' | 'response' | 'interviewed' | 'offered' | 'rejected' | 'applying' | 'error' | 'questions';
  appliedDate: Date;
  requiresInput?: boolean;
  additionalQuestions?: Array<{
    id: string;
    question: string;
    type: 'text' | 'textarea' | 'select';
    options?: string[];
    required?: boolean;
  }>;
  lat: number;
  lng: number;
  url?: string;
  source?: 'External API' | 'Direct Employer' | 'LinkedIn' | 'LinkedIn Fetched Jobs'; // Updated to include LinkedIn
  // LinkedIn-specific properties
  easyApply?: boolean;
  postedTime?: string;
  applicants?: string;
  type?: string;
  // Application status tracking
  applicationError?: string;
  applicationProcessedAt?: Date;
} 