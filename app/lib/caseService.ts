export interface Case {
  id: string;
  title: string;
  description: string;
  status: "Open" | "In Progress" | "Closed";
  priority: "Critical" | "High" | "Medium" | "Low";
  date: string;
  evidence: number;
}

// Generate mock cases
const generateMockCases = (): Case[] => {
  const statuses: ("Open" | "In Progress" | "Closed")[] = ["Open", "In Progress", "Closed"];
  const priorities: ("Critical" | "High" | "Medium" | "Low")[] = ["Critical", "High", "Medium", "Low"];
  const titles = [
    "Email Phishing Investigation",
    "Data Breach Analysis",
    "Malware Incident Response",
    "Network Intrusion",
    "Mobile Device Forensics",
    "Cloud Security Incident",
    "Ransomware Attack",
    "Insider Threat Investigation",
    "Social Engineering Attack",
    "DDoS Attack Analysis",
    "Database Security Breach",
    "Endpoint Compromise",
    "Wireless Network Attack",
    "Email Account Compromise",
    "File Integrity Violation",
    "Unauthorized Access Attempt",
    "Malware Outbreak",
    "Security Policy Violation",
    "Third Party Data Breach",
    "Physical Security Incident",
  ];

  return titles.map((title, index) => {
    const id = `C-${String(index + 1).padStart(3, "0")}`;
    const status = statuses[index % statuses.length];
    const priority = priorities[index % priorities.length];
    const day = 20 - index;
    const date = `2026-07-${String(day).padStart(2, "0")}`;
    const evidence = (index % 15) + 1;

    return {
      id,
      title,
      description: `Investigation of ${title.toLowerCase()}`,
      status,
      priority,
      date,
      evidence,
    };
  });
};

// Shared case storage
let cases: Case[] = generateMockCases();

// Get all cases
export function getCases(): Case[] {
  return cases;
}

// Get a single case by ID
export function getCaseById(id: string): Case | undefined {
  return cases.find(c => c.id === id);
}

// Create a new case
export function createCase(
  title: string,
  description: string,
  priority: "Critical" | "High" | "Medium" | "Low",
  status: "Open" | "In Progress" | "Closed"
): Case {
  const newId = `C-${String(cases.length + 1).padStart(3, "0")}`;
  const newCase: Case = {
    id: newId,
    title,
    description,
    priority,
    status,
    date: new Date().toISOString().split("T")[0],
    evidence: 0,
  };
  cases = [newCase, ...cases];
  return newCase;
}

// Update a case
export function updateCase(
  id: string,
  updates: Partial<Omit<Case, "id" | "date">>
): Case | undefined {
  const index = cases.findIndex(c => c.id === id);
  if (index === -1) return undefined;
  
  cases[index] = { ...cases[index], ...updates };
  return cases[index];
}

// Delete a case
export function deleteCase(id: string): boolean {
  const initialLength = cases.length;
  cases = cases.filter(c => c.id !== id);
  return cases.length < initialLength;
}

// Export the mock generation function for fallback
export function getMockCases(): Case[] {
  return generateMockCases();
}