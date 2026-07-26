export interface Evidence {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded: string;
  hash: string;
  caseId: string;
  integrityStatus: "Verified" | "Modified" | "Corrupted" | "Unknown";
  metadata?: any;
  filePath?: string;
}

// Global evidence store with sample data
let evidenceStore: Evidence[] = [
  {
    id: "E-001",
    name: "image_evidence.jpg",
    type: "Image",
    size: "3.4 MB",
    uploaded: "2026-07-18",
    hash: "a1b2c3d4e5f6...",
    caseId: "C-001",
    integrityStatus: "Verified"
  },
  {
    id: "E-002",
    name: "suspicious_email.eml",
    type: "Email",
    size: "245 KB",
    uploaded: "2026-07-20",
    hash: "e5f6g7h8i9j0...",
    caseId: "C-001",
    integrityStatus: "Verified"
  },
  {
    id: "E-003",
    name: "server_logs.txt",
    type: "Log",
    size: "1.2 MB",
    uploaded: "2026-07-19",
    hash: "i9j0k1l2m3n4...",
    caseId: "C-002",
    integrityStatus: "Verified"
  },
  {
    id: "E-004",
    name: "profile_pic.jpeg",
    type: "Image",
    size: "856 KB",
    uploaded: "2026-07-21",
    hash: "a7b8c9d0e1f2...",
    caseId: "C-003",
    integrityStatus: "Verified"
  },
];

// Get all evidence
export function getEvidence(): Evidence[] {
  return evidenceStore;
}

// Get evidence by case ID
export function getEvidenceByCase(caseId: string): Evidence[] {
  return evidenceStore.filter(e => e.caseId === caseId);
}

// Get evidence by ID
export function getEvidenceById(id: string): Evidence | undefined {
  return evidenceStore.find(e => e.id === id);
}

// Add new evidence
export function addEvidence(evidence: Omit<Evidence, "id">): Evidence {
  const newId = `E-${String(evidenceStore.length + 1).padStart(3, "0")}`;
  const newEvidence: Evidence = { 
    ...evidence, 
    id: newId,
    integrityStatus: evidence.integrityStatus || "Verified"
  };
  evidenceStore.push(newEvidence);
  return newEvidence;
}

// Update evidence metadata
export function updateEvidenceMetadata(id: string, metadata: any): Evidence | undefined {
  const index = evidenceStore.findIndex(e => e.id === id);
  if (index === -1) return undefined;
  evidenceStore[index].metadata = metadata;
  return evidenceStore[index];
}

// Update evidence integrity status
export function updateEvidenceIntegrity(id: string, status: "Verified" | "Modified" | "Corrupted" | "Unknown"): Evidence | undefined {
  const index = evidenceStore.findIndex(e => e.id === id);
  if (index === -1) return undefined;
  evidenceStore[index].integrityStatus = status;
  return evidenceStore[index];
}

// Delete evidence
export function deleteEvidence(id: string): boolean {
  const index = evidenceStore.findIndex(e => e.id === id);
  if (index === -1) return false;
  evidenceStore.splice(index, 1);
  return true;
}

// Get evidence count by case
export function getEvidenceCountByCase(caseId: string): number {
  return evidenceStore.filter(e => e.caseId === caseId).length;
}