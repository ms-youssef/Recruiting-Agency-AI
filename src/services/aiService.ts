export async function generateJobLeads(sector: string, agencySpecialty: string) {
  try {
    const response = await fetch("/api/discover-jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sector,
        services: agencySpecialty,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Kimo discovery failed:", error);
    return [];
  }
}
