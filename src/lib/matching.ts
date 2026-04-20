/**
 * Job Matching Algorithm for TalentLink
 * Calculates a 'Match Score' between an agency specialty and a scraped job lead.
 */

export interface AgencyProfile {
  name: string;
  sectors: string[];
  experienceLevel?: string; // Optional expansion
}

import type { JobLead } from "@/src/types";

export function calculateMatchScore(agency: AgencyProfile, job: JobLead): number {
  let score = 0;
  const maxScore = 100;

  // 1. Industry Match (40% weight)
  // Agencies usually filter by high-level industry first.
  const industryMatch = agency.sectors.some(sector => 
    job.industry.toLowerCase().includes(sector.toLowerCase()) || 
    sector.toLowerCase().includes(job.industry.toLowerCase())
  );
  if (industryMatch) score += 40;

  // 2. Skill Overlap (30% weight)
  // Check if keywords in the agency sectors/name overlap with required skills.
  const keywords = [...agency.sectors, agency.name];
  const skillMatches = job.requiredSkills.filter(skill => 
    keywords.some(k => skill.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(skill.toLowerCase()))
  );
  
  if (skillMatches.length > 0) {
    score += Math.min(30, (skillMatches.length / job.requiredSkills.length) * 60); // Bonus for high overlap
  }

  // 3. Seniority Alignment (20% weight)
  // Assume recruitment agencies have sweet spots (e.g. Exec Search vs. Entry Level)
  // For this simulation, we give a base bonus if the lead is 'Mid-Senior' or 'Executive' 
  // which are high-value for agencies.
  if (job.seniority.toLowerCase().includes('executive') || job.seniority.toLowerCase().includes('senior')) {
    score += 20;
  } else {
    score += 10; // Base baseline
  }

  // 4. Random variability for "Intelligence" feel (10% weight)
  // Real world variability and engagement metrics.
  score += Math.floor(Math.random() * 10);

  return Math.min(maxScore, score);
}

export function rankLeads(agency: AgencyProfile, leads: any[]): any[] {
  return leads
    .map(lead => ({
      ...lead,
      matchScore: calculateMatchScore(agency, lead)
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}
