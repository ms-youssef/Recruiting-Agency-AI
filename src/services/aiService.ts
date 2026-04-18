import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateJobLeads(sector: string, agencySpecialty: string) {
  try {
    const prompt = `
      You are the OpenClaw AI Engine. Your task is to simulate the output of a high-fidelity LinkedIn scraping operation.
      
      Agency Profile:
      - Specialty: ${agencySpecialty}
      - Target Sectors: ${sector}

      Generate 5 job leads that reflect currently "scraped" data from LinkedIn.
      Include a mix of "High Match" and "Broad Match" categories.
      
      For each job object, include:
      - title: (e.g. Principal Product Manager)
      - company: (Real-world tech names)
      - description: A short 2-sentence summary.
      - industry: (e.g. Fintech, SaaS, Healthcare)
      - seniority: (Entry-level, Mid-senior, Executive)
      - requiredSkills: Array of strings.
      - salary: Estimated or provided.
      - location: City/Remote.
      - scrapedAt: Current ISO timestamp.
      - sourceUrl: A plausible LinkedIn URL slug.
      - leads: Array of { name, role, type: 'C-Level' | 'HR' }

      Return strictly as a JSON array.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              company: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              industry: { type: Type.STRING },
              seniority: { type: Type.STRING },
              salary: { type: Type.STRING },
              location: { type: Type.STRING },
              requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              scrapedAt: { type: Type.STRING },
              sourceUrl: { type: Type.STRING },
              leads: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    type: { type: Type.STRING }
                  },
                  required: ["name", "role", "type"]
                }
              }
            },
            required: ["id", "company", "title", "industry", "seniority", "salary", "location", "requiredSkills", "leads"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Generation failed:", error);
    return [];
  }
}
