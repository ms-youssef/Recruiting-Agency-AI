export interface DecisionMaker {
  name: string;
  role: string;
  type: string;
  email?: string;
  phone?: string;
  bio?: string;
  linkedinProfile?: string;
  signalHireStatus?: "verified" | "pending" | "unavailable";
}

export interface CompanyInfo {
  about: string;
  website: string;
  linkedinProfile: string;
  companySize: string;
  employeeCount: string;
  headquarters: string;
}

export interface JobLead {
  id: string;
  company: string;
  title: string;
  description: string;
  industry: string;
  seniority: string;
  salary: string;
  location: string;
  requiredSkills: string[];
  scrapedAt: string;
  sourceUrl: string;
  matchScore?: number;
  companyInfo: CompanyInfo;
  leads: DecisionMaker[];
}
