import { execSync } from "child_process";
import { pool, getDefaultTenantId, getTenantIcpConfig } from "./db.js";

const SIGNALHIRE_API_KEY = process.env.SIGNALHIRE_API_KEY || "";
const SIGNALHIRE_CALLBACK_URL = "https://callback.ntscompany.net/";

type LeadRecord = {
  id: string;
  company: string;
  title: string;
  industry: string;
  seniority: string;
  salary: string;
  location: string;
  sourceUrl: string;
  description?: string;
  requiredSkills?: string[];
  companyInfo?: any;
  leads?: any[];
  scrapedAt?: string;
};

function scoreLeadAgainstIcp(lead: LeadRecord, icp: any) {
  let score = 0.35;
  const reasons: string[] = [];

  const industries: string[] = icp?.industries || [];
  const geographies: string[] = icp?.geographies || [];
  const seniorityLevels: string[] = icp?.seniority_levels || [];
  const excludedDomains: string[] = icp?.excluded_domains || [];

  if (industries.some((i) => lead.industry?.toLowerCase().includes(String(i).toLowerCase()))) {
    score += 0.25;
    reasons.push("Industry matches ICP");
  }

  if (geographies.some((g) => lead.location?.toLowerCase().includes(String(g).toLowerCase()))) {
    score += 0.2;
    reasons.push("Location matches ICP geography");
  }

  if (seniorityLevels.some((s) => lead.seniority?.toLowerCase().includes(String(s).toLowerCase()))) {
    score += 0.15;
    reasons.push("Seniority aligns with ICP");
  }

  const sourceUrl = lead.sourceUrl?.toLowerCase() || "";
  if (excludedDomains.some((d) => sourceUrl.includes(String(d).toLowerCase()))) {
    return {
      score: 0.05,
      status: "disqualified",
      reason: `Excluded domain matched: ${excludedDomains.find((d: string) => sourceUrl.includes(String(d).toLowerCase()))}`,
    };
  }

  const threshold = Number(icp?.qualification_threshold || 0.7);
  const finalScore = Math.min(0.99, Number(score.toFixed(2)));

  return {
    score: finalScore,
    status: finalScore >= threshold ? "qualified" : "disqualified",
    reason: reasons.length ? reasons.join(". ") : "Weak ICP alignment",
  };
}

async function enrichWithSignalHireOnly(lead: LeadRecord) {
  const contacts = lead.leads || [];

  if (!SIGNALHIRE_API_KEY) {
    return {
      ...lead,
      leads: contacts.map((contact) => ({
        ...contact,
        signalHireStatus: "missing_api_key",
        enrichmentSource: "SignalHire",
      })),
      enrichmentStatus: "pending",
    };
  }

  const enrichedContacts = [];

  for (const contact of contacts) {
    if (!contact.linkedinProfile) {
      enrichedContacts.push({
        ...contact,
        signalHireStatus: "missing_linkedin",
        enrichmentSource: "SignalHire",
      });
      continue;
    }

    try {
      const response = await fetch("https://www.signalhire.com/api/v1/candidate/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SIGNALHIRE_API_KEY,
        },
        body: JSON.stringify({
          callbackUrl: SIGNALHIRE_CALLBACK_URL,
          items: [contact.linkedinProfile],
        }),
      });

      const rawText = await response.text();
      const contentType = response.headers.get("content-type") || "";
      let parsed: any = null;
      let normalizedStatus = "queued";

      if (contentType.includes("application/json")) {
        try {
          parsed = rawText ? JSON.parse(rawText) : null;
        } catch {
          parsed = { rawText };
          normalizedStatus = "invalid_json_response";
        }
      } else {
        parsed = null;
        normalizedStatus = "unexpected_html_response";
      }

      if (!response.ok) {
        normalizedStatus = `error_${response.status}`;
      }

      enrichedContacts.push({
        ...contact,
        signalHireStatus: normalizedStatus,
        enrichmentSource: "SignalHire",
        signalHireRequestId: parsed?.requestId || null,
        signalHireResponse: parsed,
      });
    } catch (error: any) {
      enrichedContacts.push({
        ...contact,
        signalHireStatus: "request_failed",
        enrichmentSource: "SignalHire",
        signalHireError: error?.message || "unknown_error",
      });
    }
  }

  return {
    ...lead,
    leads: enrichedContacts,
    enrichmentStatus: enrichedContacts.some((contact) => contact.signalHireStatus === "queued")
      ? "queued"
      : enrichedContacts.some((contact) => contact.signalHireStatus === "unexpected_html_response")
        ? "provider_error"
        : "pending",
  };
}

export async function runPrdLoop(sector: string, services: string) {
  const tenantId = await getDefaultTenantId();
  const icp = await getTenantIcpConfig(tenantId);

  const runInsert = await pool.query(
    `INSERT INTO scrape_runs (tenant_id, sector, services, run_status, metadata)
     VALUES ($1, $2, $3, 'running', $4)
     RETURNING id`,
    [tenantId, sector, services, { source: 'kimo-engine', mode: 'manual-trigger' }]
  );
  const runId = runInsert.rows[0].id;

  const output = execSync(`python3 kimo_engine.py "${sector}"`, { encoding: "utf8" });
  const pulledLeads: LeadRecord[] = JSON.parse(output);

  let qualifiedCount = 0;
  let dedupedCount = 0;
  let enrichedCount = 0;
  const finalResults: any[] = [];

  for (const lead of pulledLeads) {
    const qualification = scoreLeadAgainstIcp(lead, icp);

    const duplicateCheck = await pool.query(
      `SELECT id FROM job_leads WHERE tenant_id = $1 AND (source_url = $2 OR (company = $3 AND title = $4)) LIMIT 1`,
      [tenantId, lead.sourceUrl, lead.company, lead.title]
    );
    const isDuplicate = duplicateCheck.rowCount > 0;

    const enrichedLead = await enrichWithSignalHireOnly(lead);
    if (qualification.status === "qualified") qualifiedCount += 1;
    if (isDuplicate) dedupedCount += 1;
    if (enrichedLead.enrichmentStatus === "enriched") enrichedCount += 1;

    const dedupeStatus = isDuplicate ? "duplicate" : "new";

    await pool.query(
      `INSERT INTO job_leads (
        id, tenant_id, company, title, industry, seniority, salary, location, source_url,
        qualification_score, qualification_status, qualification_reason, dedupe_status, enrichment_status, data
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15
      )
      ON CONFLICT (id) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        company = EXCLUDED.company,
        title = EXCLUDED.title,
        industry = EXCLUDED.industry,
        seniority = EXCLUDED.seniority,
        salary = EXCLUDED.salary,
        location = EXCLUDED.location,
        source_url = EXCLUDED.source_url,
        qualification_score = EXCLUDED.qualification_score,
        qualification_status = EXCLUDED.qualification_status,
        qualification_reason = EXCLUDED.qualification_reason,
        dedupe_status = EXCLUDED.dedupe_status,
        enrichment_status = EXCLUDED.enrichment_status,
        data = EXCLUDED.data,
        updated_at = CURRENT_TIMESTAMP`,
      [
        lead.id,
        tenantId,
        lead.company,
        lead.title,
        lead.industry,
        lead.seniority,
        lead.salary,
        lead.location,
        lead.sourceUrl,
        qualification.score,
        qualification.status,
        qualification.reason,
        dedupeStatus,
        enrichedLead.enrichmentStatus,
        enrichedLead,
      ]
    );

    await pool.query(`DELETE FROM contacts WHERE tenant_id = $1 AND lead_id = $2`, [tenantId, lead.id]);
    for (const contact of enrichedLead.leads || []) {
      await pool.query(
        `INSERT INTO contacts (
          tenant_id, lead_id, full_name, role, contact_type, email, phone, bio, linkedin_profile, signalhire_request_id, signalhire_status, raw_data
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          tenantId,
          lead.id,
          contact.name,
          contact.role,
          contact.type,
          contact.email || null,
          contact.phone || null,
          contact.bio || null,
          contact.linkedinProfile || null,
          contact.signalHireRequestId || null,
          contact.signalHireStatus || "pending",
          contact,
        ]
      );
    }

    await pool.query(
      `INSERT INTO activities (tenant_id, entity_type, entity_id, action, payload)
       VALUES ($1, 'job_lead', $2, $3, $4)`,
      [tenantId, lead.id, qualification.status === "qualified" ? "qualified_lead" : "disqualified_lead", {
        company: lead.company,
        title: lead.title,
        qualification,
        dedupeStatus,
        enrichmentStatus: enrichedLead.enrichmentStatus,
      }]
    );

    finalResults.push({
      ...enrichedLead,
      qualificationScore: qualification.score,
      qualificationStatus: qualification.status,
      qualificationReason: qualification.reason,
      dedupeStatus,
    });
  }

  await pool.query(
    `UPDATE scrape_runs
     SET run_status = 'completed', pulled_count = $2, qualified_count = $3, deduped_count = $4, enriched_count = $5, completed_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [runId, pulledLeads.length, qualifiedCount, dedupedCount, enrichedCount]
  );

  return {
    runId,
    tenantId,
    sector,
    services,
    pulledCount: pulledLeads.length,
    qualifiedCount,
    dedupedCount,
    enrichedCount,
    results: finalResults,
  };
}
