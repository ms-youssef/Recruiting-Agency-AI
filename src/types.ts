export interface DecisionMaker {
  name: string;
  role: string;
  type: string;
  email?: string;
  phone?: string;
  bio?: string;
  linkedinProfile?: string;
  signalHireRequestId?: number | null;
  signalHireStatus?: string;
}

export interface LeadRunSummary {
  pulled: number;
  qualified: number;
  deduped: number;
  enriched: number;
}

export interface LeadStatusSnapshot {
  id: string;
  company: string;
  title: string;
  qualification_status?: string;
  dedupe_status?: string;
  enrichment_status?: string;
  updated_at?: string;
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
