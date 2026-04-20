export async function generateJobLeads(sector: string, agencySpecialty: string) {
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

  return response.json();
}

export async function fetchRunStatus(runId: number) {
  const response = await fetch(`/api/runs/${runId}/status`);
  if (!response.ok) {
    throw new Error(`Run status failed with status ${response.status}`);
  }
  return response.json();
}

export async function fetchLeadStatus(leadId: string) {
  const response = await fetch(`/api/leads/${leadId}/status`);
  if (!response.ok) {
    throw new Error(`Lead status failed with status ${response.status}`);
  }
  return response.json();
}
