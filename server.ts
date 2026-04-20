import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { pool, initDb } from "./db.js";

// Initialize DB
initDb().catch(console.error);

const sampleLeadCatalog = [
  {
    id: "rec-001",
    company: "Homzmart",
    title: "Talent Acquisition Specialist",
    description: "Kimo identified an active talent acquisition opening tied to continued hiring momentum in Cairo. This is a strong fit for agencies with hiring support, sourcing, and employer branding capabilities.",
    industry: "E-commerce",
    seniority: "Mid-Level",
    salary: "Competitive",
    location: "Cairo, Egypt",
    requiredSkills: ["Recruitment", "Sourcing", "Stakeholder Management"],
    sourceUrl: "https://www.linkedin.com/jobs/search/?keywords=Talent%20Acquisition%20Specialist&location=Egypt",
    companyInfo: {
      about: "Homzmart is a MENA e-commerce platform focused on furniture and home goods, connecting brands and manufacturers with consumers across the region.",
      website: "https://homzmart.com",
      linkedinProfile: "https://www.linkedin.com/company/homzmart/",
      companySize: "201-500 employees",
      employeeCount: "Approx. 300+",
      headquarters: "Cairo, Egypt"
    },
    leads: [
      {
        name: "Ibrahim Mohamed",
        role: "HR Manager",
        type: "HR",
        email: "pending-signalhire@homzmart.com",
        phone: "Pending",
        bio: "HR leader supporting talent acquisition and team growth for regional expansion.",
        linkedinProfile: "https://www.linkedin.com/company/homzmart/",
        signalHireStatus: "pending"
      },
      {
        name: "Mahmoud Ibrahim",
        role: "CEO",
        type: "C-Level",
        email: "pending-signalhire@homzmart.com",
        phone: "Pending",
        bio: "Executive decision maker leading Homzmart growth and commercial expansion.",
        linkedinProfile: "https://www.linkedin.com/company/homzmart/",
        signalHireStatus: "pending"
      }
    ]
  },
  {
    id: "rec-002",
    company: "MNT-Halan",
    title: "Sr. Talent Acquisition Specialist",
    description: "Kimo found a senior talent acquisition role that signals scaling activity in a fintech environment. This opportunity suits agencies experienced in tech recruitment and leadership hiring support.",
    industry: "Fintech",
    seniority: "Senior",
    salary: "EGP 30k - 45k",
    location: "Giza, Egypt",
    requiredSkills: ["Tech Recruitment", "Fintech Experience", "Headhunting"],
    sourceUrl: "https://www.linkedin.com/jobs/search/?keywords=Senior%20Talent%20Acquisition%20Specialist&location=Egypt",
    companyInfo: {
      about: "MNT-Halan is an Egyptian fintech ecosystem offering lending, payments, e-commerce, and mobility services to underserved customers.",
      website: "https://mnt-halan.com",
      linkedinProfile: "https://www.linkedin.com/company/mnt-halan/",
      companySize: "1001-5000 employees",
      employeeCount: "Approx. 1,500+",
      headquarters: "Giza, Egypt"
    },
    leads: [
      {
        name: "Mounir Nakhla",
        role: "CEO",
        type: "C-Level",
        email: "pending-signalhire@mnt-halan.com",
        phone: "Pending",
        bio: "Founder and CEO of MNT-Halan, leading fintech scale-up strategy and market expansion.",
        linkedinProfile: "https://www.linkedin.com/in/mnakhla/",
        signalHireStatus: "pending"
      },
      {
        name: "Sara Ahmed",
        role: "HR Director",
        type: "HR",
        email: "pending-signalhire@mnt-halan.com",
        phone: "Pending",
        bio: "HR decision maker overseeing senior hiring and people strategy.",
        linkedinProfile: "https://www.linkedin.com/company/mnt-halan/",
        signalHireStatus: "pending"
      }
    ]
  },
  {
    id: "rec-003",
    company: "Magnet",
    title: "Human Resources Business Partner",
    description: "Kimo mapped a business partner role that usually indicates growth-stage organizational design work. It creates a useful opening for agencies offering HR advisory and leadership recruitment.",
    industry: "HR Services",
    seniority: "Senior",
    salary: "Competitive",
    location: "Giza, Egypt",
    requiredSkills: ["HRBP", "Organizational Development", "Stakeholder Alignment"],
    sourceUrl: "https://www.linkedin.com/jobs/search/?keywords=Human%20Resources%20Business%20Partner&location=Egypt",
    companyInfo: {
      about: "Magnet is a people and talent focused business supporting organizational hiring and HR operations across growing companies.",
      website: "https://www.magnet.com.eg/",
      linkedinProfile: "https://www.linkedin.com/company/magnetmena/",
      companySize: "51-200 employees",
      employeeCount: "Approx. 100+",
      headquarters: "Giza, Egypt"
    },
    leads: [
      {
        name: "Nour Khaled",
        role: "People Lead",
        type: "HR",
        email: "pending-signalhire@magnet.com.eg",
        phone: "Pending",
        bio: "People operations lead involved in workforce planning and hiring alignment.",
        linkedinProfile: "https://www.linkedin.com/company/magnetmena/",
        signalHireStatus: "pending"
      },
      {
        name: "Omar Adel",
        role: "Managing Director",
        type: "C-Level",
        email: "pending-signalhire@magnet.com.eg",
        phone: "Pending",
        bio: "Managing director responsible for business growth and leadership hiring priorities.",
        linkedinProfile: "https://www.linkedin.com/company/magnetmena/",
        signalHireStatus: "pending"
      }
    ]
  }
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(express.json());

  app.post("/api/discover-jobs", async (req, res) => {
    const { sector, services } = req.body;
    console.log(`Kimo: Starting LIVE discovery for ${sector}...`);

    try {
      // Execute Kimo's Python engine for live discovery
      const output = execSync(`python3 kimo_engine.py "${sector}"`, { encoding: 'utf8' });
      const results = JSON.parse(output);

      // Store in PostgreSQL
      for (const lead of results) {
        await pool.query(
          `INSERT INTO job_leads (id, company, title, industry, seniority, salary, location, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET data = $8`,
          [lead.id, lead.company, lead.title, lead.industry, lead.seniority, lead.salary, lead.location, lead]
        );
      }

      res.json({
        status: "success",
        agent: "Kimo",
        results: results
      });
    } catch (error) {
      console.error("Kimo Engine Error:", error);
      res.status(500).json({ status: "error", message: "Kimo engine failed" });
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
