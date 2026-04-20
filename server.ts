import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { pool, initDb, getDefaultTenantId } from "./db.js";
import { runPrdLoop } from "./prd_loop.js";

// Initialize DB
initDb().catch(console.error);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(express.json());

  app.post("/api/discover-jobs", async (req, res) => {
    const { sector, services } = req.body;
    console.log(`Kimo: Starting PRD loop for ${sector}...`);

    try {
      const loopResult = await runPrdLoop(sector || "Recruitment", services || "Unknown agency");
      res.json({
        status: "success",
        agent: "Kimo",
        tenant: "nts-demo",
        runId: loopResult.runId,
        summary: {
          pulled: loopResult.pulledCount,
          qualified: loopResult.qualifiedCount,
          deduped: loopResult.dedupedCount,
          enriched: loopResult.enrichedCount,
        },
        results: loopResult.results,
      });
    } catch (error) {
      console.error("Kimo Engine Error:", error);
      res.status(500).json({ status: "error", message: "Kimo engine failed" });
    }
  });

  app.get("/api/runs/:runId/status", async (req, res) => {
    try {
      const tenantId = await getDefaultTenantId();
      const runId = Number(req.params.runId);

      const runResult = await pool.query(
        `SELECT id, sector, services, run_status, pulled_count, qualified_count, deduped_count, enriched_count, started_at, completed_at, metadata
         FROM scrape_runs
         WHERE id = $1 AND tenant_id = $2
         LIMIT 1`,
        [runId, tenantId]
      );

      if (!runResult.rows[0]) {
        return res.status(404).json({ status: "error", message: "Run not found" });
      }

      const leadsResult = await pool.query(
        `SELECT id, company, title, qualification_status, dedupe_status, enrichment_status, updated_at
         FROM job_leads
         WHERE tenant_id = $1
         ORDER BY updated_at DESC
         LIMIT 20`,
        [tenantId]
      );

      return res.json({
        status: "success",
        run: runResult.rows[0],
        leads: leadsResult.rows,
      });
    } catch (error) {
      console.error("Run status error:", error);
      return res.status(500).json({ status: "error", message: "Failed to load run status" });
    }
  });

  app.get("/api/leads/:leadId/status", async (req, res) => {
    try {
      const tenantId = await getDefaultTenantId();
      const leadId = req.params.leadId;
      const leadResult = await pool.query(
        `SELECT id, company, title, qualification_score, qualification_status, qualification_reason, dedupe_status, enrichment_status, data, updated_at
         FROM job_leads
         WHERE id = $1 AND tenant_id = $2
         LIMIT 1`,
        [leadId, tenantId]
      );

      if (!leadResult.rows[0]) {
        return res.status(404).json({ status: "error", message: "Lead not found" });
      }

      const contactsResult = await pool.query(
        `SELECT full_name, role, contact_type, email, phone, bio, linkedin_profile, signalhire_request_id, signalhire_status, updated_at
         FROM contacts
         WHERE tenant_id = $1 AND lead_id = $2
         ORDER BY updated_at DESC`,
        [tenantId, leadId]
      );

      return res.json({
        status: "success",
        lead: leadResult.rows[0],
        contacts: contactsResult.rows,
      });
    } catch (error) {
      console.error("Lead status error:", error);
      return res.status(500).json({ status: "error", message: "Failed to load lead status" });
    }
  });

  app.post("/api/signalhire/callback", async (req, res) => {
    try {
      const tenantId = await getDefaultTenantId();
      const payload = Array.isArray(req.body) ? req.body : [req.body];
      const requestIdHeader = req.header("Request-Id");
      const requestId = requestIdHeader ? Number(requestIdHeader) : null;

      await pool.query(
        `INSERT INTO signalhire_callbacks (tenant_id, request_id, payload) VALUES ($1, $2, $3)`,
        [tenantId, requestId, payload]
      );

      for (const item of payload) {
        const candidate = item?.candidate || {};
        const contacts = candidate?.contacts || [];
        const social = candidate?.social || [];
        const linkedinProfile = social.find((s: any) => s?.type === "li")?.link || item?.item || null;
        const emails = contacts.filter((c: any) => c?.type === "email").map((c: any) => c.value).filter(Boolean);
        const phones = contacts.filter((c: any) => c?.type === "phone").map((c: any) => c.value).filter(Boolean);

        const existingContact = await pool.query(
          `SELECT id, lead_id, raw_data FROM contacts WHERE tenant_id = $1 AND signalhire_request_id = $2 LIMIT 1`,
          [tenantId, requestId]
        );

        const contactRow = existingContact.rows[0];
        if (!contactRow) {
          continue;
        }

        const previousRaw = contactRow.raw_data || {};
        const mergedRaw = {
          ...previousRaw,
          signalHireCallback: item,
        };

        await pool.query(
          `UPDATE contacts
           SET email = COALESCE($1, email),
               phone = COALESCE($2, phone),
               bio = COALESCE($3, bio),
               linkedin_profile = COALESCE($4, linkedin_profile),
               signalhire_status = $5,
               raw_data = $6,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $7`,
          [
            emails[0] || null,
            phones[0] || null,
            candidate?.summary || candidate?.headLine || null,
            linkedinProfile,
            item?.status === "success" ? "enriched" : item?.status || "failed",
            mergedRaw,
            contactRow.id,
          ]
        );

        await pool.query(
          `UPDATE job_leads
           SET enrichment_status = $1,
               data = jsonb_set(COALESCE(data, '{}'::jsonb), '{signalHireCallbackReceived}', 'true'::jsonb, true),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND tenant_id = $3`,
          [item?.status === "success" ? "enriched" : "callback_received", contactRow.lead_id, tenantId]
        );

        await pool.query(
          `INSERT INTO activities (tenant_id, entity_type, entity_id, action, payload)
           VALUES ($1, 'job_lead', $2, 'signalhire_callback_processed', $3)`,
          [tenantId, contactRow.lead_id, { requestId, status: item?.status, linkedinProfile }]
        );
      }

      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("SignalHire callback error:", error);
      res.status(500).json({ status: "error" });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
