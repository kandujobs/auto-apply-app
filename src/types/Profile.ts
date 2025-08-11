export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  location?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  education: Education[];
  experience: Experience[];
  skills: string[];
  interests: string[];
  statistics: {
    applied: number;
    pending: number;
    offers: number;
  };
  radius?: number;
  // Resume upload fields
  resume_url?: string;
  resume_filename?: string;
  resume_file_size?: number;
  resume_file_type?: string;
  resume_uploaded_at?: string;
} 