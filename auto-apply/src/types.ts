export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  resumePath: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  // Additional fields for form filling
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  address?: string;
  company?: string;
  jobTitle?: string;
}

export interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  description: string;
  current: boolean;
}

export interface Education {
  degree: string;
  school: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
}

export interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  requirements?: string[];
  salary?: string;
  postedDate?: string;
}

export interface ApplicationResult {
  success: boolean;
  jobId: string;
  jobTitle: string;
  company: string;
  appliedAt: Date;
  screenshotPath?: string;
  error?: string;
  applicationId?: string;
}

export interface LinkedInCredentials {
  email: string;
  password: string;
}

export interface BrowserConfig {
  headless: boolean;
  slowMo: number;
  pageLoadTimeout: number;
  elementWaitTimeout: number;
}

export interface ApplicationConfig {
  resumePath: string;
  screenshotDir: string;
  credentials: LinkedInCredentials;
  browser: BrowserConfig;
} 