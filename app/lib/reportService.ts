// ============================================================
// REPORTS SERVICE - Complete Court-Admissible Report System
// ============================================================

export interface OrganizationInfo {
  name: string;
  logo: string;
  department: string;
  address: string;
  contact: string;
  registrationNumber: string;
  accreditation: string;
  laboratoryName: string;
  templateVersion: string;
}

export interface LegalAuthority {
  type: 'court_order' | 'search_warrant' | 'client_authorization' | 'internal_investigation' | 'law_enforcement' | 'regulatory' | 'written_consent' | 'other';
  referenceNumber: string;
  issuingAuthority: string;
  dateIssued: string;
  validUntil: string;
  authorizedOfficer: string;
  jurisdiction: string;
  description?: string;
}

export interface InvestigatorInfo {
  name: string;
  designation: string;
  experience: string;
  certification: string;
  organization: string;
  signature: string;
  date: string;
}

export interface EvidenceCollection {
  collector: string;
  witness: string;
  collectionMethod: string;
  permission: string;
  location: string;
  date: string;
  time: string;
  deviceDetails: string;
}

export interface StandardsFollowed {
  iso27037: boolean;
  iso27042: boolean;
  iso27043: boolean;
  nist80086: boolean;
  swgde: boolean;
  other?: string[];
}

export interface ChainOfCustodyEntry {
  id: string;
  evidenceId: string;
  from: string;
  to: string;
  date: string;
  time: string;
  reason: string;
  location: string;
  signature: string;
}

export interface ExpertOpinion {
  opinion: string;
  reviewed: boolean;
  reviewedBy?: string;
  reviewDate?: string;
}

export interface ReportLimitations {
  limitations: string[];
}

export interface LegalDeclaration {
  text: string;
  signed: boolean;
  signatory: string;
  date: string;
}

export interface AIDisclosure {
  used: boolean;
  modules: string[];
  reviewedByInvestigator: boolean;
  confidence: string;
}

export interface ReportSignatures {
  leadInvestigator: string;
  leadDate: string;
  reviewer: string;
  reviewDate: string;
  laboratoryManager?: string;
  labManagerDate?: string;
  digitalSignature?: string;
  qrVerification?: string;
}

export interface Report {
  id: string;
  caseId: string;
  title: string;
  type: 'executive' | 'forensic' | 'incident' | 'technical' | 'court' | 'summary' | 'compliance' | 'audit' | 'chain_of_custody' | 'evidence_inventory' | 'metadata' | 'email' | 'log' | 'osint' | 'timeline' | 'malware' | 'file_analysis' | 'ai' | 'threat_intel' | 'full';
  status: 'draft' | 'under_review' | 'approved' | 'final' | 'archived';
  version: string;
  createdAt: string;
  updatedAt: string;
  generatedAt: string;
  generatedBy: string;
  approvedBy?: string;
  approvedAt?: string;

  // Organization Info
  organization: OrganizationInfo;

  // Legal Authority
  legalAuthority: LegalAuthority;

  // Investigation Request
  requestedBy: string;
  requestOrganization: string;
  requestDate: string;
  requestReason: string;
  requestObjectives: string[];

  // Investigator Declaration
  investigator: InvestigatorInfo;

  // Evidence Collection
  evidenceCollection: EvidenceCollection;

  // Methodology
  methodology: string[];

  // Standards
  standards: StandardsFollowed;

  // Evidence Preservation
  evidenceStored: string;
  storageLocation: string;
  evidenceLocker: string;
  cloudStorage: string;
  encryption: string;
  hashVerified: boolean;
  backupAvailable: boolean;

  // Chain of Custody
  chainOfCustody: ChainOfCustodyEntry[];

  // Expert Opinion
  expertOpinion: ExpertOpinion;

  // Limitations
  limitations: ReportLimitations;

  // Legal Declaration
  legalDeclaration: LegalDeclaration;

  // AI Disclosure
  aiDisclosure: AIDisclosure;

  // Signatures
  signatures: ReportSignatures;

  // Case Content (auto-generated)
  content: ReportContent;
}

export interface ReportContent {
  // Case Details
  caseId: string;
  caseTitle: string;
  caseDescription: string;
  caseStatus: string;
  casePriority: string;
  caseType: string;
  investigator: string;
  createdDate: string;
  closedDate?: string;

  // Executive Summary
  executiveSummary: string;
  
  // Evidence Summary
  evidenceSummary: {
    total: number;
    items: {
      id: string;
      name: string;
      type: string;
      size: string;
      uploaded: string;
      hash: string;
    }[];
  };
  
  // Metadata Analysis
  metadataAnalysis: {
    filesAnalyzed: number;
    findings: string[];
    summary: string;
  };
  
  // Timeline
  timeline: {
    date: string;
    events: {
      time: string;
      event: string;
      description: string;
    }[];
  }[];
  
  // Log Analysis
  logAnalysis: {
    totalLines: number;
    suspicious: number;
    threats: number;
    summary: string;
    findings: string[];
  };
  
  // Email Analysis
  emailAnalysis: {
    totalAnalyzed: number;
    suspicious: number;
    riskLevel: string;
    findings: string[];
    summary: string;
  };
  
  // OSINT Findings
  osintFindings: {
    searchesPerformed: number;
    findings: string[];
    summary: string;
  };
  
  // Incident Response
  incidentResponse: {
    planApplied: string;
    containment: string[];
    eradication: string[];
    recovery: string[];
    lessonsLearned: string[];
    status: string;
  };
  
  // Forensic Scoring
  forensicScore: {
    score: number;
    level: string;
    factors: string[];
  };
  
  // Risk Assessment
  riskAssessment: {
    level: string;
    score: number;
    factors: string[];
  };
  
  // Recommendations
  recommendations: string[];
  
  // Conclusion
  conclusion: string;
}

// ============================================================
// DEMO ORGANIZATION
// ============================================================

const defaultOrganization: OrganizationInfo = {
  name: "SamiNova Cybersecurity",
  logo: "🔍 TraceLens AI",
  department: "Digital Forensics Division",
  address: "Islamabad, Pakistan",
  contact: "forensics@saminova.com | +92-300-1234567",
  registrationNumber: "SN-DF-2026-001",
  accreditation: "ISO/IEC 17025 Accredited",
  laboratoryName: "SamiNova DFIR Lab",
  templateVersion: "2.0"
};

// ============================================================
// DEMO REPORTS
// ============================================================

const demoReports: Report[] = [
  {
    id: "RPT-001",
    caseId: "C-001",
    title: "Email Phishing Investigation Report",
    type: "court",
    status: "final",
    version: "1.0",
    createdAt: "2026-07-18T14:00:00Z",
    updatedAt: "2026-07-18T16:00:00Z",
    generatedAt: "2026-07-18T16:00:00Z",
    generatedBy: "Samina Parveen",
    approvedBy: "Ahmed Khan",
    approvedAt: "2026-07-19T10:00:00Z",
    organization: defaultOrganization,
    legalAuthority: {
      type: "court_order",
      referenceNumber: "CO-2026-001",
      issuingAuthority: "District Court Islamabad",
      dateIssued: "2026-07-15",
      validUntil: "2026-08-15",
      authorizedOfficer: "Justice Ahmed Ali",
      jurisdiction: "Islamabad, Pakistan"
    },
    requestedBy: "XYZ Bank SOC Team",
    requestOrganization: "XYZ Bank Limited",
    requestDate: "2026-07-14",
    requestReason: "Suspected phishing attack targeting employees",
    requestObjectives: [
      "Determine source of phishing emails",
      "Identify affected accounts",
      "Preserve digital evidence",
      "Prepare expert report for legal proceedings"
    ],
    investigator: {
      name: "Samina Parveen",
      designation: "Lead Digital Forensic Investigator",
      experience: "8+ years in DFIR",
      certification: "GCFA, CCFE, CEH",
      organization: "SamiNova Cybersecurity",
      signature: "Samina Parveen",
      date: "2026-07-18"
    },
    evidenceCollection: {
      collector: "Samina Parveen",
      witness: "Ahmed Khan",
      collectionMethod: "Bit-by-bit forensic image acquisition",
      permission: "Client Authorization",
      location: "XYZ Bank Head Office, Islamabad",
      date: "2026-07-18",
      time: "09:00",
      deviceDetails: "Email server - Exchange Server 2019"
    },
    methodology: [
      "Evidence was acquired using accepted forensic procedures",
      "SHA-256 cryptographic hashes were generated for all evidence",
      "Evidence integrity was verified throughout the investigation",
      "Metadata was extracted using forensic tools",
      "AI-assisted log analysis was performed",
      "Timeline was reconstructed from available evidence",
      "All findings were reviewed by the investigator"
    ],
    standards: {
      iso27037: true,
      iso27042: true,
      iso27043: true,
      nist80086: true,
      swgde: true,
      other: ["ISO/IEC 17025"]
    },
    evidenceStored: "Secure Evidence Locker",
    storageLocation: "SamiNova DFIR Lab, Islamabad",
    evidenceLocker: "Evidence Locker #A-07",
    cloudStorage: "Encrypted Cloud Backup",
    encryption: "AES-256",
    hashVerified: true,
    backupAvailable: true,
    chainOfCustody: [
      {
        id: "COC-001",
        evidenceId: "E-001",
        from: "Samina Parveen",
        to: "Evidence Locker",
        date: "2026-07-18",
        time: "09:30",
        reason: "Initial storage",
        location: "SamiNova DFIR Lab",
        signature: "Samina Parveen"
      },
      {
        id: "COC-002",
        evidenceId: "E-001",
        from: "Evidence Locker",
        to: "Forensic Workstation",
        date: "2026-07-18",
        time: "10:00",
        reason: "Forensic analysis",
        location: "SamiNova DFIR Lab",
        signature: "Samina Parveen"
      }
    ],
    expertOpinion: {
      opinion: "Based upon the examination described in this report, it is my professional opinion that the analyzed email demonstrates characteristics consistent with a phishing campaign. The evidence shows domain spoofing, urgency tactics, and malicious links targeting employee credentials.",
      reviewed: true,
      reviewedBy: "Ahmed Khan",
      reviewDate: "2026-07-19"
    },
    limitations: {
      limitations: [
        "Cloud logs were unavailable for the investigation period",
        "Encrypted volume on affected system could not be accessed",
        "Mobile device evidence was not submitted for analysis"
      ]
    },
    legalDeclaration: {
      text: "I certify that the examination documented in this report was conducted using accepted digital forensic methodologies. The findings presented are based solely on the evidence examined. This report does not determine legal guilt or innocence; such determinations remain the responsibility of the appropriate legal authority.",
      signed: true,
      signatory: "Samina Parveen",
      date: "2026-07-18"
    },
    aiDisclosure: {
      used: true,
      modules: [
        "Metadata interpretation",
        "Log summarization",
        "Timeline generation",
        "Threat classification",
        "Email analysis"
      ],
      reviewedByInvestigator: true,
      confidence: "High"
    },
    signatures: {
      leadInvestigator: "Samina Parveen",
      leadDate: "2026-07-18",
      reviewer: "Ahmed Khan",
      reviewDate: "2026-07-19",
      laboratoryManager: "Sara Ahmed",
      labManagerDate: "2026-07-19",
      digitalSignature: "SP-2026-07-18-DFIR",
      qrVerification: "https://verify.tracelens.ai/RPT-001"
    },
    content: {
      caseId: "C-001",
      caseTitle: "Email Phishing Investigation",
      caseDescription: "Investigation into a phishing campaign targeting employees.",
      caseStatus: "Closed",
      casePriority: "High",
      caseType: "Phishing",
      investigator: "Samina Parveen",
      createdDate: "2026-07-18",
      executiveSummary: "A sophisticated phishing campaign targeting employees was identified on July 18, 2026. The investigation revealed that the attackers used domain spoofing to impersonate the IT department. 15 employees received phishing emails, and 3 clicked on malicious links. No credentials were compromised due to MFA enforcement. The incident was contained within 4 hours.",
      evidenceSummary: {
        total: 5,
        items: [
          { id: "E-001", name: "phishing_email.eml", type: "Email", size: "245 KB", uploaded: "2026-07-18", hash: "a1b2c3d4e5f6..." }
        ]
      },
      metadataAnalysis: {
        filesAnalyzed: 3,
        findings: ["Email headers revealed spoofed sender domain", "Reply-To address mismatched"],
        summary: "Metadata analysis confirmed spoofing."
      },
      timeline: [
        {
          date: "2026-07-18",
          events: [
            { time: "09:00", event: "Case Created", description: "Investigation initiated" },
            { time: "10:00", event: "Containment", description: "Blocked domain and reset passwords" }
          ]
        }
      ],
      logAnalysis: {
        totalLines: 1257,
        suspicious: 23,
        threats: 4,
        summary: "Analysis detected 4 potential security threats.",
        findings: ["15 failed login attempts", "3 suspicious PowerShell executions"]
      },
      emailAnalysis: {
        totalAnalyzed: 5,
        suspicious: 3,
        riskLevel: "High",
        findings: ["Spoofed sender domain detected", "Malicious link detected"],
        summary: "3 out of 5 emails were identified as phishing attempts."
      },
      osintFindings: {
        searchesPerformed: 2,
        findings: ["Domain registered 3 days ago", "IP associated with known threat actor"],
        summary: "OSINT revealed recently registered domain."
      },
      incidentResponse: {
        planApplied: "Phishing Incident Response Plan",
        containment: ["Blocked phishing domain", "Reset passwords"],
        eradication: ["Removed malicious emails", "Scanned endpoints"],
        recovery: ["Re-enabled accounts", "Implemented email filtering"],
        lessonsLearned: ["Implement MFA", "Enhance email filtering"],
        status: "Completed"
      },
      forensicScore: {
        score: 92,
        level: "High",
        factors: ["Evidence integrity verified", "Chain of custody maintained", "Multiple analysis methods used"]
      },
      riskAssessment: {
        level: "Medium",
        score: 65,
        factors: ["Phishing attempt detected", "No data exfiltration confirmed", "MFA prevented credential theft"]
      },
      recommendations: [
        "Implement Multi-Factor Authentication (MFA) for all users",
        "Enhance email filtering and security controls",
        "Conduct regular phishing simulation training",
        "Establish incident response playbook for phishing"
      ],
      conclusion: "The phishing incident was successfully contained and resolved. All affected systems were cleaned and restored."
    }
  }
];

// ============================================================
// SERVICE FUNCTIONS
// ============================================================

let reports: Report[] = [...demoReports];
let reportCounter = 2;

export function getReports(caseId?: string): Report[] {
  if (caseId) {
    return reports.filter(r => r.caseId === caseId);
  }
  return reports;
}

export function getReportById(id: string): Report | null {
  return reports.find(r => r.id === id) || null;
}

export function createReport(data: Partial<Report>): Report {
  const newReport: Report = {
    id: `RPT-${String(reportCounter++).padStart(3, '0')}`,
    caseId: data.caseId || "",
    title: data.title || "Investigation Report",
    type: data.type || "full",
    status: "draft",
    version: "1.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
    generatedBy: data.generatedBy || "Samina Parveen",
    organization: data.organization || defaultOrganization,
    legalAuthority: data.legalAuthority || {
      type: "client_authorization",
      referenceNumber: "",
      issuingAuthority: "",
      dateIssued: "",
      validUntil: "",
      authorizedOfficer: "",
      jurisdiction: ""
    },
    requestedBy: data.requestedBy || "",
    requestOrganization: data.requestOrganization || "",
    requestDate: data.requestDate || "",
    requestReason: data.requestReason || "",
    requestObjectives: data.requestObjectives || [],
    investigator: data.investigator || {
      name: "Samina Parveen",
      designation: "Lead Digital Forensic Investigator",
      experience: "8+ years in DFIR",
      certification: "GCFA, CCFE, CEH",
      organization: "SamiNova Cybersecurity",
      signature: "Samina Parveen",
      date: new Date().toISOString().split('T')[0]
    },
    evidenceCollection: data.evidenceCollection || {
      collector: "",
      witness: "",
      collectionMethod: "",
      permission: "",
      location: "",
      date: "",
      time: "",
      deviceDetails: ""
    },
    methodology: data.methodology || [
      "Evidence was acquired using accepted forensic procedures",
      "SHA-256 hashes were generated",
      "Evidence integrity was verified"
    ],
    standards: data.standards || {
      iso27037: true,
      iso27042: true,
      iso27043: true,
      nist80086: true,
      swgde: true
    },
    evidenceStored: data.evidenceStored || "Secure Evidence Locker",
    storageLocation: data.storageLocation || "SamiNova DFIR Lab",
    evidenceLocker: data.evidenceLocker || "",
    cloudStorage: data.cloudStorage || "Encrypted Cloud Backup",
    encryption: data.encryption || "AES-256",
    hashVerified: data.hashVerified ?? true,
    backupAvailable: data.backupAvailable ?? true,
    chainOfCustody: data.chainOfCustody || [],
    expertOpinion: data.expertOpinion || {
      opinion: "",
      reviewed: false
    },
    limitations: data.limitations || {
      limitations: []
    },
    legalDeclaration: data.legalDeclaration || {
      text: "I certify that the examination documented in this report was conducted using accepted digital forensic methodologies.",
      signed: false,
      signatory: "",
      date: ""
    },
    aiDisclosure: data.aiDisclosure || {
      used: true,
      modules: ["Metadata interpretation", "Log summarization"],
      reviewedByInvestigator: true,
      confidence: "High"
    },
    signatures: data.signatures || {
      leadInvestigator: "",
      leadDate: "",
      reviewer: "",
      reviewDate: ""
    },
    content: data.content || {
      caseId: data.caseId || "",
      caseTitle: "",
      caseDescription: "",
      caseStatus: "",
      casePriority: "",
      caseType: "",
      investigator: "Samina Parveen",
      createdDate: new Date().toISOString().split('T')[0],
      executiveSummary: "",
      evidenceSummary: { total: 0, items: [] },
      metadataAnalysis: { filesAnalyzed: 0, findings: [], summary: "" },
      timeline: [],
      logAnalysis: { totalLines: 0, suspicious: 0, threats: 0, summary: "", findings: [] },
      emailAnalysis: { totalAnalyzed: 0, suspicious: 0, riskLevel: "", findings: [], summary: "" },
      osintFindings: { searchesPerformed: 0, findings: [], summary: "" },
      incidentResponse: { planApplied: "", containment: [], eradication: [], recovery: [], lessonsLearned: [], status: "" },
      forensicScore: { score: 0, level: "", factors: [] },
      riskAssessment: { level: "", score: 0, factors: [] },
      recommendations: [],
      conclusion: ""
    }
  };
  reports = [newReport, ...reports];
  return newReport;
}

export function updateReportStatus(id: string, status: Report['status']): Report | null {
  const index = reports.findIndex(r => r.id === id);
  if (index === -1) return null;
  reports[index].status = status;
  reports[index].updatedAt = new Date().toISOString();
  return reports[index];
}

export function deleteReport(id: string): boolean {
  const index = reports.findIndex(r => r.id === id);
  if (index === -1) return false;
  reports = reports.filter(r => r.id !== id);
  return true;
}

export function getReportStats(caseId?: string) {
  const filtered = caseId ? reports.filter(r => r.caseId === caseId) : reports;
  return {
    total: filtered.length,
    draft: filtered.filter(r => r.status === 'draft').length,
    underReview: filtered.filter(r => r.status === 'under_review').length,
    approved: filtered.filter(r => r.status === 'approved').length,
    final: filtered.filter(r => r.status === 'final').length,
    archived: filtered.filter(r => r.status === 'archived').length,
  };
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    under_review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    final: 'bg-green-500/20 text-green-400 border-green-500/30',
    archived: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  return colors[status] || colors.draft;
}

export const reportTypes = ['executive', 'forensic', 'incident', 'technical', 'court', 'summary', 'compliance', 'audit', 'chain_of_custody', 'evidence_inventory', 'metadata', 'email', 'log', 'osint', 'timeline', 'malware', 'file_analysis', 'ai', 'threat_intel', 'full'];
export const reportStatuses = ['draft', 'under_review', 'approved', 'final', 'archived'];