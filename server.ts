import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for "OpenClaw" simulation
  app.post("/api/discover-jobs", async (req, res) => {
    const { sector, services } = req.body;
    // In a real app, this would trigger the OpenClaw agent.
    // Here we return some simulated data.
    // For now, let's just return a placeholder, the frontend will use Gemini to "flesh it out" or we can do it here.
    res.json({
      status: "searching",
      results: [
        {
          id: "1",
          company: "TechNexus Solutions",
          title: "Senior Full Stack Engineer",
          salary: "$140k - $180k",
          location: "Remote / New York",
          requirements: ["React", "Node.js", "AWS"],
          sector: sector || "Technology",
          leads: [
            { name: "Sarah Chen", role: "Head of Engineering", type: "C-Level" },
            { name: "Mark Thompson", role: "Talent Acquisition Lead", type: "HR" }
          ]
        },
        {
          id: "2",
          company: "EcoFlow Energy",
          title: "Operations Manager",
          salary: "$110k - $130k",
          location: "Austin, TX",
          requirements: ["Supply Chain", "Logistics", "Sustainability"],
          sector: sector || "Energy",
          leads: [
            { name: "Julian Rossi", role: "COO", type: "C-Level" },
            { name: "Elena Martinez", role: "HR Director", type: "HR" }
          ]
        }
      ]
    });
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
