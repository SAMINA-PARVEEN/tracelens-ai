"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PremiumLogo from "../components/ui/PremiumLogo";
import { supabase } from "../lib/supabase";

// ============================================================
// TYPES - Updated to match your database
// ============================================================

interface OrganizationInfo {
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

interface LegalAuthority {
  type: string;
  referenceNumber: string;
  issuingAuthority: string;
  dateIssued: string;
  validUntil: string;
  authorizedOfficer: string;
  jurisdiction: string;
}

interface InvestigatorInfo {
  name: string;
  designation: string;
  experience: string;
  certification: string;
  organization: string;
}

interface EvidenceCollection {
  collector: string;
  witness: string;
  collectionMethod: string;
  permission: string;
  location: string;
  date: string;
  time: string;
  deviceDetails: string;
}

interface ChainOfCustodyEntry {
  from: string;
  to: string;
  date: string;
  time: string;
  reason: string;
  location: string;
}

interface ReportContent {
  caseTitle: string;
  caseDescription: string;
  caseStatus: string;
  casePriority: string;
  caseType: string;
  createdDate: string;
  closedDate?: string;
  executiveSummary: string;
  evidenceSummary: { total: number; items: any[] };
  metadataAnalysis: { filesAnalyzed: number; findings: string[]; summary: string };
  timeline: { date: string; events: { time: string; event: string; description: string }[] }[];
  logAnalysis: { totalLines: number; suspicious: number; threats: number; summary: string; findings: string[] };
  emailAnalysis: { totalAnalyzed: number; suspicious: number; riskLevel: string; findings: string[]; summary: string };
  osintFindings: { searchesPerformed: number; findings: string[]; summary: string };
  incidentResponse: { planApplied: string; containment: string[]; eradication: string[]; recovery: string[]; lessonsLearned: string[]; status: string };
  forensicScore: { score: number; level: string; factors: string[] };
  riskAssessment: { level: string; score: number; factors: string[] };
  recommendations: string[];
  conclusion: string;
}

interface Report {
  id: string;
  caseId: string;
  title: string;
  type: string;
  status: string;
  version: string;
  createdAt: string;
  generatedAt: string;
  generatedBy: string;
  organization: OrganizationInfo;
  legalAuthority: LegalAuthority;
  requestedBy: string;
  requestOrganization: string;
  requestDate: string;
  requestReason: string;
  requestObjectives: string[];
  investigator: InvestigatorInfo;
  evidenceCollection: EvidenceCollection;
  methodology: string[];
  standards: string[];
  evidenceStored: string;
  storageLocation: string;
  evidenceLocker: string;
  cloudStorage: string;
  encryption: string;
  hashVerified: boolean;
  backupAvailable: boolean;
  chainOfCustody: ChainOfCustodyEntry[];
  expertOpinion: string;
  limitations: string[];
  legalDeclaration: string;
  aiDisclosure: {
    used: boolean;
    modules: string[];
    reviewedByInvestigator: boolean;
    confidence: string;
  };
  signatures: {
    leadInvestigator: string;
    leadDate: string;
    reviewer: string;
    reviewDate: string;
    laboratoryManager: string;
    labManagerDate: string;
  };
  content: ReportContent;
}

// ============================================================
// DEFAULT ORGANIZATION
// ============================================================

const defaultOrganization: OrganizationInfo = {
  name: "SamiNova Cybersecurity",
  logo: "TraceLens AI",
  department: "Digital Forensics Division",
  address: "Islamabad, Pakistan",
  contact: "forensics@saminova.com | +92-300-1234567",
  registrationNumber: "SN-DF-2026-001",
  accreditation: "ISO/IEC 17025 Accredited",
  laboratoryName: "SamiNova DFIR Lab",
  templateVersion: "3.0"
};

// ============================================================
// COMPLETE DEMO REPORT WITH REAL DATA
// ============================================================

const demoReport: Report = {
  id: "RPT-2026-001",
  caseId: "CASE-2026-001",
  title: "Digital Forensic Investigation Report - Advanced Persistent Threat (APT) Attack",
  type: "Court Admissible Report",
  status: "Final",
  version: "2.1",
  createdAt: "2026-07-18T09:00:00Z",
  generatedAt: "2026-07-23T16:30:00Z",
  generatedBy: "Samina Parveen, Lead Digital Forensic Investigator",
  organization: defaultOrganization,
  legalAuthority: {
    type: "Court Order",
    referenceNumber: "CO-2026-0452",
    issuingAuthority: "Special Court (Cyber Crimes), Islamabad",
    dateIssued: "2026-07-15",
    validUntil: "2026-08-30",
    authorizedOfficer: "Honorable Justice Muhammad Aslam",
    jurisdiction: "Islamabad Capital Territory, Pakistan"
  },
  requestedBy: "National Cyber Security Agency (NCSA)",
  requestOrganization: "Government of Pakistan - Cyber Security Division",
  requestDate: "2026-07-14",
  requestReason: "Suspected Advanced Persistent Threat (APT) attack targeting critical government infrastructure. Multiple government servers showing signs of unauthorized access and data exfiltration.",
  requestObjectives: [
    "Identify the source and nature of the APT attack",
    "Determine the extent of data breach and compromised systems",
    "Preserve all digital evidence following forensic best practices",
    "Identify attacker infrastructure, TTPs, and indicators of compromise",
    "Provide expert testimony and court-admissible report for legal proceedings",
    "Recommend security improvements to prevent future attacks"
  ],
  investigator: {
    name: "Samina Parveen",
    designation: "Lead Digital Forensic Investigator",
    experience: "12+ years in Digital Forensics & Incident Response",
    certification: "GCFA, GCFE, CCFE, CEH, CISSP",
    organization: "SamiNova Cybersecurity, Digital Forensics Division"
  },
  evidenceCollection: {
    collector: "Samina Parveen",
    witness: "Ahmed Khan",
    collectionMethod: "Bit-by-bit forensic image acquisition using FTK Imager and EnCase",
    permission: "Court Order and Client Authorization",
    location: "National Data Center, Islamabad",
    date: "2026-07-18",
    time: "08:30 - 17:00",
    deviceDetails: "Multiple systems including: 3x Dell PowerEdge R740 Servers, 2x HPE ProLiant DL380 Servers, Network Firewall Logs, IDS/IPS Logs"
  },
  methodology: [
    "Evidence was acquired using accepted forensic procedures following NIST SP 800-86 guidelines",
    "SHA-256 cryptographic hashes were generated for all evidence for integrity verification",
    "Write-blockers were used for all hard drive acquisitions to prevent data modification",
    "Memory dumps were captured using WinPmem before system shutdown",
    "Network traffic logs were preserved from firewall and IDS/IPS systems",
    "Metadata was extracted using FTK, X-Ways Forensics, and Axiom",
    "AI-assisted log analysis was performed using TraceLens AI",
    "Timeline was reconstructed from all available evidence sources",
    "All findings were independently reviewed by the investigative team"
  ],
  standards: [
    "ISO/IEC 27037 - Guidelines for identification, collection, acquisition, and preservation of digital evidence",
    "ISO/IEC 27042 - Guidelines for analysis and interpretation of digital evidence",
    "ISO/IEC 27043 - Incident investigation principles and processes",
    "NIST SP 800-86 - Guide to Integrating Forensic Techniques into Incident Response",
    "SWGDE Best Practices for Digital Evidence Acquisition",
    "ISO/IEC 17025 - Laboratory Accreditation",
    "ACI - Association of Certified Investigators Standards"
  ],
  evidenceStored: "Secure Forensic Evidence Locker - Climate Controlled",
  storageLocation: "SamiNova DFIR Laboratory, Islamabad",
  evidenceLocker: "Evidence Locker #A-12 (High Security)",
  cloudStorage: "Encrypted Cloud Backup (AES-256-GCM)",
  encryption: "AES-256-XTS Full Disk Encryption",
  hashVerified: true,
  backupAvailable: true,
  chainOfCustody: [
    { from: "Samina Parveen", to: "Evidence Locker A-12", date: "2026-07-18", time: "09:15", reason: "Initial evidence storage", location: "SamiNova DFIR Lab" },
    { from: "Evidence Locker A-12", to: "Forensic Workstation 01", date: "2026-07-18", time: "09:45", reason: "Forensic acquisition", location: "Forensic Lab" },
    { from: "Forensic Workstation 01", to: "Evidence Locker A-12", date: "2026-07-18", time: "17:30", reason: "Acquisition complete", location: "SamiNova DFIR Lab" },
    { from: "Evidence Locker A-12", to: "Forensic Workstation 02", date: "2026-07-19", time: "09:00", reason: "Analysis phase", location: "Forensic Lab" },
    { from: "Forensic Workstation 02", to: "Evidence Locker A-12", date: "2026-07-21", time: "16:00", reason: "Analysis complete", location: "SamiNova DFIR Lab" }
  ],
  expertOpinion: "Based upon comprehensive examination of all available digital evidence, including forensic images, memory dumps, network logs, and system artifacts, it is my professional opinion that the evidence demonstrates an organized Advanced Persistent Threat (APT) attack. The attack was executed with sophisticated techniques including custom malware, credential harvesting, lateral movement, and data exfiltration over encrypted channels. The attacker's infrastructure has been identified as originating from Eastern Europe, using multiple proxy layers and compromised legitimate services for command and control. The scope of compromise includes 4 critical government servers with potential data exfiltration. Timely detection and response limited the impact, however significant security improvements are recommended.",
  limitations: [
    "Cloud-based logs from AWS infrastructure were not available for the investigation period",
    "Encrypted volume on affected system could not be fully accessed without additional credentials",
    "Mobile device evidence was not submitted as part of the investigation scope",
    "Some network traffic during the early stages of the attack was not captured",
    "Attacker infrastructure likely used additional proxy layers not identified"
  ],
  legalDeclaration: "I, Samina Parveen, Lead Digital Forensic Investigator, hereby certify that the examination documented in this report was conducted using accepted digital forensic methodologies and procedures. The findings presented are based solely on the evidence examined. All evidence was handled following proper chain of custody procedures. This report does not determine legal guilt or innocence; such determinations remain the responsibility of the appropriate legal authority. The findings are true and accurate to the best of my knowledge and professional expertise.",
  aiDisclosure: {
    used: true,
    modules: [
      "Automated metadata extraction and analysis",
      "Log correlation and pattern detection",
      "Timeline reconstruction from multiple sources",
      "Threat classification and MITRE ATT&CK mapping",
      "Suspicious activity detection",
      "Natural language processing for log analysis",
      "Anomaly detection in system artifacts"
    ],
    reviewedByInvestigator: true,
    confidence: "Very High (95% confidence level - validated by investigator)"
  },
  signatures: {
    leadInvestigator: "Samina Parveen",
    leadDate: "2026-07-23",
    reviewer: "Ahmed Khan",
    reviewDate: "2026-07-24",
    laboratoryManager: "Sara Ahmed",
    labManagerDate: "2026-07-24"
  },
  content: {
    caseTitle: "Advanced Persistent Threat (APT) Investigation",
    caseDescription: "Investigation into a sophisticated APT attack targeting critical government infrastructure. Multiple servers compromised with evidence of data exfiltration.",
    caseStatus: "Investigation Complete - Referred for Prosecution",
    casePriority: "Critical",
    caseType: "APT Attack / Cyber Espionage",
    createdDate: "2026-07-18",
    executiveSummary: `On July 18, 2026, the National Cyber Security Agency (NCSA) reported a suspected Advanced Persistent Threat (APT) attack against critical government infrastructure. The investigation revealed a sophisticated, multi-stage attack that began approximately 3 months prior. The attackers used:
    
1. **Initial Access**: Spear-phishing email with malicious macro-enabled document
2. **Persistence**: Custom backdoor malware (identified as 'ShadowGate')
3. **Lateral Movement**: Use of compromised credentials and Pass-the-Hash techniques
4. **Data Exfiltration**: 2.3 GB of sensitive data encrypted and exfiltrated over Tor network
5. **Infrastructure**: Attack servers identified in Eastern Europe (IP: 185.xxx.xxx.xxx)

The attack was successfully contained and eradicated. All compromised systems were rebuilt with enhanced security controls. The forensic evidence has been preserved for legal proceedings.`,
    evidenceSummary: {
      total: 12,
      items: [
        { id: "E-001", name: "server01_disk_image.E01", type: "Forensic Image", size: "120 GB", uploaded: "2026-07-18", hash: "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6..." },
        { id: "E-002", name: "server02_disk_image.E01", type: "Forensic Image", size: "80 GB", uploaded: "2026-07-18", hash: "B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6..." },
        { id: "E-003", name: "server03_memory_dump.mem", type: "Memory Dump", size: "16 GB", uploaded: "2026-07-18", hash: "C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6..." },
        { id: "E-004", name: "firewall_logs_2026-07.csv", type: "Network Log", size: "2.3 MB", uploaded: "2026-07-19", hash: "D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6..." },
        { id: "E-005", name: "ids_logs_2026-07.txt", type: "Security Log", size: "15.6 MB", uploaded: "2026-07-19", hash: "E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6..." },
        { id: "E-006", name: "malware_sample.exe", type: "Malware File", size: "245 KB", uploaded: "2026-07-19", hash: "F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6..." },
        { id: "E-007", name: "screenshot_suspicious_email.png", type: "Image", size: "1.2 MB", uploaded: "2026-07-19", hash: "G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6..." },
        { id: "E-008", name: "network_pcap_2026-07.pcap", type: "Network Capture", size: "450 MB", uploaded: "2026-07-20", hash: "H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6..." },
        { id: "E-009", name: "registry_export.reg", type: "Registry Export", size: "8.2 MB", uploaded: "2026-07-20", hash: "I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6..." },
        { id: "E-010", name: "event_logs.evtx", type: "Windows Log", size: "12.4 MB", uploaded: "2026-07-20", hash: "J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6..." },
        { id: "E-011", name: "suspicious_email.eml", type: "Email", size: "325 KB", uploaded: "2026-07-20", hash: "K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6..." },
        { id: "E-012", name: "disk_image_backup.E01", type: "Forensic Image", size: "200 GB", uploaded: "2026-07-21", hash: "L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6..." }
      ]
    },
    metadataAnalysis: {
      filesAnalyzed: 156,
      findings: [
        "Spoofed email headers identified - Domain: 'gov-pakistan.com' (fraudulent)",
        "Malware executable compiled on 2026-04-15 at 14:32 UTC",
        "Metadata shows file created by user 'johndoe' on affected server",
        "Suspicious PowerShell execution with encoded commands detected",
        "Registry modifications for persistence identified in HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
        "Network traffic analysis revealed C2 beacon every 60 seconds",
        "Exfiltration traffic identified to destination IP 185.xxx.xxx.xxx",
        "Email attachments contain malicious macros using VBA",
        "Timeline shows initial compromise on 2026-04-20 at 09:15 UTC"
      ],
      summary: "Metadata analysis revealed sophisticated APT attack with multiple techniques. Key findings include spoofed email domains, custom malware, encoded PowerShell execution, persistent registry modifications, and C2 communication patterns. All indicators point to a coordinated APT campaign."
    },
    timeline: [
      {
        date: "2026-04-20",
        events: [
          { time: "09:15", event: "Initial Compromise", description: "Employee clicked on malicious link in spear-phishing email - C2 beacon established" },
          { time: "09:32", event: "Malware Download", description: "ShadowGate malware downloaded from domain 'cdn-update-service.com'" },
          { time: "10:05", event: "Persistence Created", description: "Registry key added for auto-start on system boot" }
        ]
      },
      {
        date: "2026-04-25",
        events: [
          { time: "02:00", event: "Lateral Movement", description: "Pass-the-Hash attack on server02 using compromised credentials" },
          { time: "03:30", event: "Privilege Escalation", description: "Administrative access obtained on server02" }
        ]
      },
      {
        date: "2026-05-10",
        events: [
          { time: "14:20", event: "Data Exfiltration", description: "2.3 GB of sensitive data exfiltrated over encrypted channel" }
        ]
      },
      {
        date: "2026-07-18",
        events: [
          { time: "08:00", event: "Incident Detection", description: "NCSA detected suspicious network activity" },
          { time: "08:30", event: "Response Initiated", description: "DFIR team deployed to incident site" },
          { time: "09:00", event: "Evidence Collection", description: "Forensic imaging of affected systems started" },
          { time: "10:30", event: "Containment", description: "Affected servers isolated from network" },
          { time: "11:00", event: "Eradication", description: "Malware removed from compromised systems" },
          { time: "14:00", event: "Recovery", description: "Servers rebuilt from clean backups" },
          { time: "16:00", event: "Investigation Update", description: "Initial investigation completed with all evidence preserved" }
        ]
      }
    ],
    logAnalysis: {
      totalLines: 12457,
      suspicious: 234,
      threats: 18,
      summary: "Analysis of 12,457 log entries detected 18 confirmed security threats with 234 suspicious activities. Key findings include multiple failed login attempts, PowerShell executions, registry modifications, and C2 beaconing activity. 4 indicators of compromise (IOCs) were identified.",
      findings: [
        "187 failed login attempts from IP 192.168.1.45 (brute force detected)",
        "23 successful logins from suspicious IP ranges",
        "15 unauthorized PowerShell execution events detected",
        "12 instances of encoded command execution",
        "8 C2 beacon messages over port 443",
        "4 successful lateral movement events",
        "3 privilege escalation attempts detected",
        "2 malware execution events confirmed",
        "1 data exfiltration event confirmed"
      ]
    },
    emailAnalysis: {
      totalAnalyzed: 245,
      suspicious: 12,
      riskLevel: "Critical",
      findings: [
        "Phishing email impersonating IT department - 'it-support@gov-pakistan.com'",
        "Malicious macros in attached Word document",
        "Spoofed sender domain detected - 'gov-pakistan.com' vs legitimate 'gov.pk'",
        "Urgency language used - 'Immediate Action Required'",
        "Malicious link: 'http://cdn-update-service.com/update.doc'",
        "Reply-To address mismatched - 'support@malicious-domain.com'",
        "Email headers reveal originating IP from 185.xxx.xxx.xxx"
      ],
      summary: "Email analysis identified 12 suspicious emails out of 245 analyzed. The primary threat is a spear-phishing campaign targeting government employees with malicious attachments. The campaign uses sophisticated social engineering techniques and spoofed domains. 3 emails were confirmed as successful compromises."
    },
    osintFindings: {
      searchesPerformed: 15,
      findings: [
        "Domain 'gov-pakistan.com' registered 3 days before the attack on 2026-04-17",
        "Hosting IP 185.xxx.xxx.xxx associated with known APT group 'APT28'",
        "Malware hash identified in VirusTotal - 17/65 vendors flagged as malicious",
        "C2 domain 'cdn-update-service.com' linked to previous campaigns",
        "Attacker infrastructure spans 5 countries - Eastern Europe origin",
        "Similar TTPs identified in 3 previous government attacks",
        "MITRE ATT&CK mapping: T1566 (Phishing), T1059 (Command and Scripting), T1078 (Valid Accounts), T1021 (Remote Services), T1041 (Exfiltration Over C2 Channel)"
      ],
      summary: "OSINT investigation confirmed the attack originated from Eastern Europe and is associated with a known APT group. Multiple domains and IP addresses have been identified as part of the attacker infrastructure. The attack was well-planned and executed with sophisticated techniques."
    },
    incidentResponse: {
      planApplied: "National Cyber Security Incident Response Plan (NCS-IRP v3.0)",
      containment: [
        "Isolated all compromised servers from the network (4 servers)",
        "Blocked malicious domains at network firewall and DNS level (12 domains)",
        "Quarantined all emails from suspicious sender domains",
        "Reset all compromised user credentials (23 user accounts)",
        "Implemented additional network segmentation",
        "Enabled enhanced logging on all critical systems"
      ],
      eradication: [
        "Removed ShadowGate malware from all affected systems",
        "Deleted all suspicious registry entries and scheduled tasks",
        "Uninstalled unauthorized software detected in the environment",
        "Scanned all endpoints with updated antivirus signatures",
        "Applied security patches to all critical systems",
        "Updated IDS/IPS signatures with identified IOCs"
      ],
      recovery: [
        "Re-imaged all compromised servers from clean backups",
        "Re-enabled affected user accounts after password reset",
        "Reconnected systems to network with enhanced monitoring",
        "Implemented additional email filtering and security controls",
        "Conducted comprehensive security awareness training for all staff"
      ],
      lessonsLearned: [
        "Implement mandatory Multi-Factor Authentication (MFA) for all users",
        "Deploy advanced email filtering with AI-based threat detection",
        "Conduct regular phishing simulation training for employees",
        "Implement Zero Trust architecture across government network",
        "Enhance monitoring and detection capabilities with SIEM",
        "Establish 24/7 security operations center (SOC)",
        "Regular security audits and penetration testing"
      ],
      status: "Completed - All systems restored and secured"
    },
    forensicScore: {
      score: 94,
      level: "High",
      factors: [
        "Evidence integrity verified with SHA-256 hashes",
        "Complete chain of custody maintained",
        "Multiple analysis methods and tools used",
        "AI-assisted analysis validates findings",
        "Independent peer review completed"
      ]
    },
    riskAssessment: {
      level: "Critical",
      score: 85,
      factors: [
        "Confirmed APT attack with data exfiltration",
        "Critical government systems compromised",
        "Sensitive data potentially exfiltrated (2.3 GB)",
        "Attacker infrastructure identified and active",
        "Potential for further attacks on other systems",
        "Immediate risk mitigation required"
      ]
    },
    recommendations: [
      "Implement Multi-Factor Authentication (MFA) for ALL user accounts immediately",
      "Deploy AI-powered email security solution to prevent phishing attacks",
      "Conduct mandatory security awareness training for all employees",
      "Establish 24/7 Security Operations Center (SOC) with advanced threat detection",
      "Implement Zero Trust Architecture across all government networks",
      "Deploy Endpoint Detection and Response (EDR) on all critical systems",
      "Regular security audits and vulnerability assessments",
      "Develop and test incident response playbook for APT attacks",
      "Enhance network segmentation and least privilege access",
      "Implement threat intelligence sharing with international partners",
      "Regular backup verification and disaster recovery testing",
      "Deploy SIEM solution with advanced analytics and threat hunting"
    ],
    conclusion: "The investigation successfully identified and contained a sophisticated Advanced Persistent Threat (APT) attack against critical government infrastructure. The attack, attributed to a known APT group from Eastern Europe, involved custom malware, credential harvesting, lateral movement, and data exfiltration. All compromised systems have been restored and secured. The forensic evidence has been preserved and is ready for legal proceedings. The security recommendations provided will significantly enhance the organization's cybersecurity posture and prevent similar incidents in the future."
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatDate(dateString: string): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // ============ LOAD REAL CASES FROM SUPABASE ============
  useEffect(() => {
    async function loadCases() {
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('id, case_id, title')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading cases:', error);
          return;
        }

        if (data && data.length > 0) {
          setCases(data);
          setSelectedCaseId(data[0].id);
          setIsMounted(true);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    }

    loadCases();
  }, []);

  // ============ LOAD REPORTS FROM SUPABASE ============
  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        
        let query = supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (selectedCaseId) {
          query = query.eq('case_id', selectedCaseId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error loading reports:', error);
          setReports([]);
          setLoading(false);
          return;
        }

        // If no reports exist, add demo report
        if (!data || data.length === 0) {
          if (selectedCaseId) {
            // Get the case_id string for the selected case
            const { data: caseData } = await supabase
              .from('cases')
              .select('case_id')
              .eq('id', selectedCaseId)
              .single();
            
            if (caseData && caseData.case_id === 'CASE-2026-001') {
              // Insert demo report using your actual table columns
              const demoReportData = {
                organization_id: '00000000-0000-0000-0000-000000000001',
                case_id: selectedCaseId,
                created_by: '11111111-1111-1111-1111-111111111111',
                report_number: 'RPT-2026-001',
                report_title: 'Digital Forensic Investigation Report - APT Attack',
                report_type: 'Court Report',
                version: '2.1',
                status: 'Final',
                confidentiality: 'Confidential',
                summary: demoReport.content.executiveSummary,
                findings: demoReport.content.metadataAnalysis.findings,
                recommendations: demoReport.content.recommendations,
                evidence_count: demoReport.content.evidenceSummary.total,
                created_at: new Date().toISOString(),
                generated_at: new Date().toISOString(),
              };
              
              await supabase.from('reports').insert([demoReportData]);
            }
          }
          
          // Reload reports
          const { data: reloadedReports } = await supabase
            .from('reports')
            .select('*')
            .eq('case_id', selectedCaseId)
            .order('created_at', { ascending: false });
          
          setReports(reloadedReports || []);
          setLoading(false);
          return;
        }

        // Map database columns to Report interface
        const mappedReports = data?.map((item: any) => ({
          id: item.id,
          caseId: item.case_id,
          title: item.report_title || item.title,
          type: item.report_type || 'Court Report',
          status: item.status || 'Draft',
          version: item.version || '1.0',
          createdAt: item.created_at,
          generatedAt: item.generated_at || item.created_at,
          generatedBy: item.created_by || 'System',
          organization: defaultOrganization,
          legalAuthority: {
            type: 'Court Order',
            referenceNumber: 'CO-2026-001',
            issuingAuthority: 'Special Court (Cyber Crimes), Islamabad',
            dateIssued: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
            authorizedOfficer: 'Honorable Justice Muhammad Aslam',
            jurisdiction: 'Islamabad Capital Territory, Pakistan'
          },
          requestedBy: 'National Cyber Security Agency (NCSA)',
          requestOrganization: 'Government of Pakistan - Cyber Security Division',
          requestDate: new Date().toISOString().split('T')[0],
          requestReason: 'Suspected cyber attack targeting government infrastructure',
          requestObjectives: ['Identify attack source', 'Preserve evidence', 'Provide expert report'],
          investigator: {
            name: 'Samina Parveen',
            designation: 'Lead Digital Forensic Investigator',
            experience: '12+ years in Digital Forensics & Incident Response',
            certification: 'GCFA, GCFE, CCFE, CEH, CISSP',
            organization: 'SamiNova Cybersecurity, Digital Forensics Division'
          },
          evidenceCollection: {
            collector: 'Samina Parveen',
            witness: 'Ahmed Khan',
            collectionMethod: 'Bit-by-bit forensic image acquisition',
            permission: 'Court Order and Client Authorization',
            location: 'National Data Center, Islamabad',
            date: new Date().toISOString().split('T')[0],
            time: '08:30 - 17:00',
            deviceDetails: 'Multiple systems: 3x Dell PowerEdge R740 Servers, 2x HPE ProLiant DL380 Servers'
          },
          methodology: [
            'Evidence was acquired using accepted forensic procedures',
            'SHA-256 cryptographic hashes were generated for all evidence',
            'Write-blockers were used for all hard drive acquisitions',
            'Metadata was extracted using forensic tools',
            'AI-assisted log analysis was performed',
            'Timeline was reconstructed from available evidence',
            'All findings were reviewed by the investigative team'
          ],
          standards: [
            'ISO/IEC 27037',
            'ISO/IEC 27042',
            'ISO/IEC 27043',
            'NIST SP 800-86',
            'SWGDE Best Practices',
            'ISO/IEC 17025'
          ],
          evidenceStored: 'Secure Forensic Evidence Locker',
          storageLocation: 'SamiNova DFIR Laboratory, Islamabad',
          evidenceLocker: 'Evidence Locker #A-12',
          cloudStorage: 'Encrypted Cloud Backup (AES-256-GCM)',
          encryption: 'AES-256-XTS Full Disk Encryption',
          hashVerified: true,
          backupAvailable: true,
          chainOfCustody: [],
          expertOpinion: item.summary || '',
          limitations: [],
          legalDeclaration: 'I certify that the examination documented in this report was conducted using accepted digital forensic methodologies.',
          aiDisclosure: {
            used: true,
            modules: ['Metadata extraction', 'Log analysis', 'Timeline generation', 'Threat classification'],
            reviewedByInvestigator: true,
            confidence: 'Very High'
          },
          signatures: {
            leadInvestigator: 'Samina Parveen',
            leadDate: new Date().toISOString().split('T')[0],
            reviewer: '',
            reviewDate: '',
            laboratoryManager: '',
            labManagerDate: ''
          },
          content: {
            caseTitle: item.summary ? 'Investigation Report' : 'New Investigation',
            caseDescription: '',
            caseStatus: 'Open',
            casePriority: 'High',
            caseType: 'Cyber Attack',
            createdDate: new Date().toISOString().split('T')[0],
            executiveSummary: item.summary || '',
            evidenceSummary: { total: item.evidence_count || 0, items: [] },
            metadataAnalysis: { filesAnalyzed: 0, findings: item.findings || [], summary: '' },
            timeline: [],
            logAnalysis: { totalLines: 0, suspicious: 0, threats: 0, summary: '', findings: [] },
            emailAnalysis: { totalAnalyzed: 0, suspicious: 0, riskLevel: '', findings: [], summary: '' },
            osintFindings: { searchesPerformed: 0, findings: [], summary: '' },
            incidentResponse: { planApplied: '', containment: [], eradication: [], recovery: [], lessonsLearned: [], status: '' },
            forensicScore: { score: 0, level: '', factors: [] },
            riskAssessment: { level: '', score: 0, factors: [] },
            recommendations: item.recommendations || [],
            conclusion: ''
          }
        })) || [];

        setReports(mappedReports);
      } catch (err) {
        console.error('Error:', err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    }

    if (selectedCaseId && isMounted) {
      loadReports();
    }
  }, [selectedCaseId, isMounted]);

  // ============ HANDLE CREATE REPORT ============
  const handleCreateReport = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      const profile = profileData?.[0];
      if (!profile) {
        alert('No profile found. Please make sure you are logged in.');
        return;
      }

      // Get organization
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);
      
      const orgId = orgData?.[0]?.id || null;

      // Get the case_id string for display
      const { data: caseData } = await supabase
        .from('cases')
        .select('case_id')
        .eq('id', selectedCaseId)
        .single();

      const { data, error } = await supabase
        .from('reports')
        .insert([{
          organization_id: orgId,
          case_id: selectedCaseId,
          created_by: profile.id,
          report_number: `RPT-${Date.now().toString().slice(-6)}`,
          report_title: `Investigation Report - ${new Date().toLocaleDateString()}`,
          report_type: 'Court Report',
          version: '1.0',
          status: 'Draft',
          confidentiality: 'Confidential',
          evidence_count: 0,
          summary: 'New investigation report',
          findings: {},
          recommendations: {},
          created_at: new Date().toISOString(),
          generated_at: new Date().toISOString(),
        }])
        .select();

      if (error) {
        console.error('Error creating report:', error);
        alert('Failed to create report. Please try again.');
        return;
      }

      // Reload reports
      const { data: updatedReports } = await supabase
        .from('reports')
        .select('*')
        .eq('case_id', selectedCaseId)
        .order('created_at', { ascending: false });

      const mappedReports = updatedReports?.map((item: any) => ({
        id: item.id,
        caseId: item.case_id,
        title: item.report_title || item.title,
        type: item.report_type || 'Court Report',
        status: item.status || 'Draft',
        version: item.version || '1.0',
        createdAt: item.created_at,
        generatedAt: item.generated_at || item.created_at,
        generatedBy: item.created_by || 'System',
        organization: defaultOrganization,
        content: {
          caseTitle: 'New Investigation',
          caseDescription: '',
          caseStatus: 'Open',
          casePriority: 'High',
          caseType: 'Cyber Attack',
          createdDate: new Date().toISOString().split('T')[0],
          executiveSummary: item.summary || '',
          evidenceSummary: { total: 0, items: [] },
          metadataAnalysis: { filesAnalyzed: 0, findings: [], summary: '' },
          timeline: [],
          logAnalysis: { totalLines: 0, suspicious: 0, threats: 0, summary: '', findings: [] },
          emailAnalysis: { totalAnalyzed: 0, suspicious: 0, riskLevel: '', findings: [], summary: '' },
          osintFindings: { searchesPerformed: 0, findings: [], summary: '' },
          incidentResponse: { planApplied: '', containment: [], eradication: [], recovery: [], lessonsLearned: [], status: '' },
          forensicScore: { score: 0, level: '', factors: [] },
          riskAssessment: { level: '', score: 0, factors: [] },
          recommendations: [],
          conclusion: ''
        }
      })) || [];

      setReports(mappedReports);
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to create report. Please try again.');
    }
  };

  // ============ HANDLE VIEW REPORT ============
  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  // ============ HANDLE EXPORT ============
  const handleExport = (report: Report) => {
    const html = generateReportHTML(report);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentCase = cases.find(c => c.id === selectedCaseId);
  const filteredReports = reports.filter(r => r.caseId === selectedCaseId);

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="text-gray-400">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1220]">
      
      {/* Navbar */}
      <nav className="bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1E293B] px-6 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <PremiumLogo size="md" variant="white" />
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/reports" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Reports
            </Link>
            <div className="flex items-center space-x-3 pl-4 border-l border-[#1E293B]">
              <div className="w-8 h-8 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">S</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Samina</p>
                <p className="text-xs text-gray-500">Lead Investigator</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Forensic Reports</h1>
            <p className="text-gray-400">Court-admissible digital forensic investigation reports</p>
          </div>
          <button
            onClick={handleCreateReport}
            className="px-4 py-2 bg-[#3B82F6] text-white rounded-xl text-sm font-medium hover:bg-[#2563EB] transition"
          >
            + New Report
          </button>
        </div>

        {/* Case Selector */}
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400">Current Case:</span>
              {currentCase ? (
                <span className="text-sm font-medium text-white">
                  {currentCase.case_id} - {currentCase.title}
                </span>
              ) : (
                <span className="text-sm text-yellow-400">No case selected</span>
              )}
            </div>
            <button
              onClick={() => setShowCaseModal(true)}
              className="px-4 py-2 text-sm bg-[#0B1220] border border-[#2A3A4A] text-gray-300 rounded-xl hover:bg-[#1E293B] transition-all"
            >
              Select Case
            </button>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-12 text-center">
              <p className="text-gray-400">No reports found for this case</p>
              <button
                onClick={handleCreateReport}
                className="mt-4 px-4 py-2 bg-[#3B82F6] text-white rounded-xl text-sm font-medium hover:bg-[#2563EB] transition"
              >
                Create First Report
              </button>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-5 hover:border-[#3B82F6]/30 transition-all cursor-pointer"
                onClick={() => handleViewReport(report)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-sm font-semibold text-white">{report.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        report.status === 'Final' 
                          ? 'bg-green-500/20 text-green-400'
                          : report.status === 'Draft'
                          ? 'bg-gray-500/20 text-gray-400'
                          : report.status === 'Approved'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {report.status}
                      </span>
                      <span className="text-xs text-gray-400">{report.type}</span>
                      <span className="text-xs text-gray-500">v{report.version}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>📅 {formatDate(report.createdAt)}</span>
                      <span>👤 {report.generatedBy}</span>
                      <span>📁 {report.caseId}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExport(report); }}
                      className="px-3 py-1.5 bg-[#22C55E]/20 text-[#22C55E] rounded-lg text-xs font-medium hover:bg-[#22C55E]/30 transition"
                    >
                      📥 Export
                    </button>
                    <button className="px-3 py-1.5 bg-[#3B82F6]/20 text-[#3B82F6] rounded-lg text-xs font-medium hover:bg-[#3B82F6]/30 transition">
                      View →
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* View Report Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedReport.title}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedReport.status === 'Final' 
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {selectedReport.status}
                  </span>
                  <span className="text-xs text-gray-400">{selectedReport.type}</span>
                  <span className="text-xs text-gray-400">{selectedReport.id}</span>
                  <span className="text-xs text-gray-500">v{selectedReport.version}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport(selectedReport)}
                  className="px-3 py-1.5 bg-[#22C55E]/20 text-[#22C55E] rounded-lg text-xs font-medium hover:bg-[#22C55E]/30 transition"
                >
                  📥 Export
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Report Preview */}
            <div className="bg-white rounded-xl p-8 text-gray-900 max-h-[70vh] overflow-y-auto">
              
              {/* Cover with PremiumLogo */}
              <div className="text-center border-b border-gray-200 pb-6 mb-6">
                <div className="flex justify-center mb-4">
                  <PremiumLogo size="lg" variant="dark" />
                </div>
                <div className="text-sm text-gray-500 font-medium tracking-wider uppercase mb-1">
                  AI-Powered Digital Investigation Platform
                </div>
                <div className="text-lg font-semibold text-gray-800">{selectedReport.organization.department}</div>
                <div className="text-sm text-gray-500">{selectedReport.organization.address}</div>
                <div className="text-sm text-gray-500">{selectedReport.organization.contact}</div>
                <div className="text-xs text-gray-400 mt-1">{selectedReport.organization.accreditation}</div>
                <div className="text-2xl font-bold text-gray-900 mt-4">{selectedReport.title}</div>
                <div className="text-sm text-gray-500 mt-1">Report ID: {selectedReport.id} | Version: {selectedReport.version}</div>
                <div className="text-sm text-gray-500">Generated: {formatDate(selectedReport.generatedAt)}</div>
                <div className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">{selectedReport.status}</div>
              </div>

              {/* Part A: Organization */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">A. Organization Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Organization:</span> {selectedReport.organization.name}</div>
                  <div><span className="text-gray-500">Department:</span> {selectedReport.organization.department}</div>
                  <div><span className="text-gray-500">Address:</span> {selectedReport.organization.address}</div>
                  <div><span className="text-gray-500">Contact:</span> {selectedReport.organization.contact}</div>
                  <div><span className="text-gray-500">Registration:</span> {selectedReport.organization.registrationNumber}</div>
                  <div><span className="text-gray-500">Accreditation:</span> {selectedReport.organization.accreditation}</div>
                  <div><span className="text-gray-500">Laboratory:</span> {selectedReport.organization.laboratoryName}</div>
                  <div><span className="text-gray-500">Template Version:</span> {selectedReport.organization.templateVersion}</div>
                </div>
              </div>

              {/* Part B: Legal Authority */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">B. Legal Authority</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Type:</span> {selectedReport.legalAuthority.type}</div>
                  <div><span className="text-gray-500">Reference:</span> {selectedReport.legalAuthority.referenceNumber}</div>
                  <div><span className="text-gray-500">Issuing Authority:</span> {selectedReport.legalAuthority.issuingAuthority}</div>
                  <div><span className="text-gray-500">Date Issued:</span> {selectedReport.legalAuthority.dateIssued}</div>
                  <div><span className="text-gray-500">Valid Until:</span> {selectedReport.legalAuthority.validUntil}</div>
                  <div><span className="text-gray-500">Jurisdiction:</span> {selectedReport.legalAuthority.jurisdiction}</div>
                  <div className="col-span-2"><span className="text-gray-500">Authorized Officer:</span> {selectedReport.legalAuthority.authorizedOfficer}</div>
                </div>
              </div>

              {/* Part C: Investigation Request */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">C. Investigation Request</h3>
                <div className="text-sm space-y-1">
                  <div><span className="text-gray-500">Requested By:</span> {selectedReport.requestedBy}</div>
                  <div><span className="text-gray-500">Organization:</span> {selectedReport.requestOrganization}</div>
                  <div><span className="text-gray-500">Request Date:</span> {selectedReport.requestDate}</div>
                  <div><span className="text-gray-500">Reason:</span> {selectedReport.requestReason}</div>
                  <div><span className="text-gray-500">Objectives:</span></div>
                  <ul className="list-disc list-inside pl-4">
                    {selectedReport.requestObjectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Part D: Investigator */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">D. Investigator Declaration</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Name:</span> {selectedReport.investigator.name}</div>
                  <div><span className="text-gray-500">Designation:</span> {selectedReport.investigator.designation}</div>
                  <div><span className="text-gray-500">Experience:</span> {selectedReport.investigator.experience}</div>
                  <div><span className="text-gray-500">Certification:</span> {selectedReport.investigator.certification}</div>
                  <div className="col-span-2"><span className="text-gray-500">Organization:</span> {selectedReport.investigator.organization}</div>
                </div>
              </div>

              {/* Part E: Evidence Collection */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">E. Evidence Collection Authorization</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Collector:</span> {selectedReport.evidenceCollection.collector}</div>
                  <div><span className="text-gray-500">Witness:</span> {selectedReport.evidenceCollection.witness}</div>
                  <div><span className="text-gray-500">Method:</span> {selectedReport.evidenceCollection.collectionMethod}</div>
                  <div><span className="text-gray-500">Permission:</span> {selectedReport.evidenceCollection.permission}</div>
                  <div><span className="text-gray-500">Location:</span> {selectedReport.evidenceCollection.location}</div>
                  <div><span className="text-gray-500">Date:</span> {selectedReport.evidenceCollection.date}</div>
                  <div><span className="text-gray-500">Time:</span> {selectedReport.evidenceCollection.time}</div>
                  <div className="col-span-2"><span className="text-gray-500">Device Details:</span> {selectedReport.evidenceCollection.deviceDetails}</div>
                </div>
              </div>

              {/* Part F: Methodology */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">F. Methodology</h3>
                <ul className="list-disc list-inside text-sm space-y-1 pl-4">
                  {selectedReport.methodology.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>

              {/* Part G: Standards */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">G. Standards Followed</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedReport.standards.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">✓ {s}</span>
                  ))}
                </div>
              </div>

              {/* Part H: Evidence Preservation */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">H. Evidence Preservation</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Storage:</span> {selectedReport.evidenceStored}</div>
                  <div><span className="text-gray-500">Location:</span> {selectedReport.storageLocation}</div>
                  <div><span className="text-gray-500">Locker:</span> {selectedReport.evidenceLocker}</div>
                  <div><span className="text-gray-500">Cloud:</span> {selectedReport.cloudStorage}</div>
                  <div><span className="text-gray-500">Encryption:</span> {selectedReport.encryption}</div>
                  <div><span className="text-gray-500">Hash Verified:</span> {selectedReport.hashVerified ? '✅ Yes' : '❌ No'}</div>
                  <div><span className="text-gray-500">Backup:</span> {selectedReport.backupAvailable ? '✅ Available' : '❌ Not Available'}</div>
                </div>
              </div>

              {/* Part I: Chain of Custody */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">I. Chain of Custody</h3>
                <div className="space-y-2">
                  {selectedReport.chainOfCustody.map((coc, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm p-2 bg-gray-50 rounded">
                      <span className="font-medium">{coc.from}</span>
                      <span>→</span>
                      <span>{coc.to}</span>
                      <span className="text-gray-500">{coc.date} {coc.time}</span>
                      <span className="text-gray-400 text-xs">{coc.reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Part J: Executive Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">J. Executive Summary</h3>
                <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                  {selectedReport.content.executiveSummary}
                </div>
              </div>

              {/* Part K: Expert Opinion */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">K. Expert Opinion</h3>
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm text-gray-700">{selectedReport.expertOpinion}</p>
                </div>
              </div>

              {/* Part L: Limitations */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">L. Limitations</h3>
                <ul className="list-disc list-inside text-sm space-y-1 pl-4">
                  {selectedReport.limitations.map((l, i) => (
                    <li key={i} className="text-red-600">{l}</li>
                  ))}
                </ul>
              </div>

              {/* Part M: Legal Declaration */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">M. Legal Declaration</h3>
                <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-gray-500">
                  <p className="text-sm text-gray-700">{selectedReport.legalDeclaration}</p>
                  <p className="text-sm text-gray-500 mt-2">Signed by: {selectedReport.investigator.name}</p>
                </div>
              </div>

              {/* Part N: AI Disclosure */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">N. AI Disclosure</h3>
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <p className="text-sm text-gray-700 font-medium">AI was used to assist in:</p>
                  <ul className="list-disc list-inside text-sm pl-4 mt-1">
                    {selectedReport.aiDisclosure.modules.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-gray-700 mt-2">✅ Reviewed by investigator: {selectedReport.aiDisclosure.reviewedByInvestigator ? 'Yes' : 'No'}</p>
                  <p className="text-sm text-gray-700">Confidence: {selectedReport.aiDisclosure.confidence}</p>
                </div>
              </div>

              {/* Part O: Signatures */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">O. Signatures</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="font-semibold">{selectedReport.signatures.leadInvestigator}</p>
                    <div className="border-b border-gray-400 my-1"></div>
                    <p className="text-xs text-gray-500">Lead Investigator</p>
                    <p className="text-xs text-gray-400">{selectedReport.signatures.leadDate}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{selectedReport.signatures.reviewer}</p>
                    <div className="border-b border-gray-400 my-1"></div>
                    <p className="text-xs text-gray-500">Reviewer</p>
                    <p className="text-xs text-gray-400">{selectedReport.signatures.reviewDate}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{selectedReport.signatures.laboratoryManager}</p>
                    <div className="border-b border-gray-400 my-1"></div>
                    <p className="text-xs text-gray-500">Laboratory Manager</p>
                    <p className="text-xs text-gray-400">{selectedReport.signatures.labManagerDate}</p>
                  </div>
                </div>
              </div>

              {/* Evidence Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">Evidence Summary</h3>
                <p className="text-sm text-gray-500 mb-2">Total: {selectedReport.content.evidenceSummary.total} items</p>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {selectedReport.content.evidenceSummary.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500">{item.type} • {item.size}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata Analysis */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">Metadata Analysis</h3>
                <p className="text-sm text-gray-500 mb-2">Files Analyzed: {selectedReport.content.metadataAnalysis.filesAnalyzed}</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mb-2">{selectedReport.content.metadataAnalysis.summary}</p>
                <div className="space-y-1">
                  {selectedReport.content.metadataAnalysis.findings.map((finding, i) => (
                    <div key={i} className="text-sm p-2 bg-blue-50 rounded text-blue-800">• {finding}</div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">Investigation Timeline</h3>
                {selectedReport.content.timeline.map((day, i) => (
                  <div key={i}>
                    <h4 className="font-semibold text-sm text-blue-600 mt-2">{day.date}</h4>
                    {day.events.map((event, j) => (
                      <div key={j} className="flex gap-3 text-sm py-1 border-b border-gray-100">
                        <span className="text-gray-500 w-16">{event.time}</span>
                        <div>
                          <div className="font-medium">{event.event}</div>
                          <div className="text-gray-500 text-xs">{event.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Log Analysis */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">Log Analysis</h3>
                <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <span className="text-gray-500">Total Lines</span>
                    <div className="font-bold">{selectedReport.content.logAnalysis.totalLines}</div>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded text-center">
                    <span className="text-yellow-600">Suspicious</span>
                    <div className="font-bold text-yellow-700">{selectedReport.content.logAnalysis.suspicious}</div>
                  </div>
                  <div className="p-2 bg-red-50 rounded text-center">
                    <span className="text-red-600">Threats</span>
                    <div className="font-bold text-red-700">{selectedReport.content.logAnalysis.threats}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mb-2">{selectedReport.content.logAnalysis.summary}</p>
                <div className="space-y-1">
                  {selectedReport.content.logAnalysis.findings.map((finding, i) => (
                    <div key={i} className="text-sm p-2 bg-red-50 rounded text-red-800">• {finding}</div>
                  ))}
                </div>
              </div>

              {/* Email Analysis */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">Email Analysis</h3>
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <span className="text-gray-500">Total Analyzed</span>
                    <div className="font-bold">{selectedReport.content.emailAnalysis.totalAnalyzed}</div>
                  </div>
                  <div className="p-2 bg-red-50 rounded text-center">
                    <span className="text-red-600">Suspicious</span>
                    <div className="font-bold text-red-700">{selectedReport.content.emailAnalysis.suspicious}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mb-2">{selectedReport.content.emailAnalysis.summary}</p>
                <div className="space-y-1">
                  {selectedReport.content.emailAnalysis.findings.map((finding, i) => (
                    <div key={i} className="text-sm p-2 bg-red-50 rounded text-red-800">• {finding}</div>
                  ))}
                </div>
              </div>

              {/* OSINT Findings */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">OSINT Findings</h3>
                <p className="text-sm text-gray-500 mb-2">Searches Performed: {selectedReport.content.osintFindings.searchesPerformed}</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mb-2">{selectedReport.content.osintFindings.summary}</p>
                <div className="space-y-1">
                  {selectedReport.content.osintFindings.findings.map((finding, i) => (
                    <div key={i} className="text-sm p-2 bg-blue-50 rounded text-blue-800">• {finding}</div>
                  ))}
                </div>
              </div>

              {/* Incident Response */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">Incident Response</h3>
                <p className="text-sm text-gray-500 mb-2">Plan Applied: {selectedReport.content.incidentResponse.planApplied}</p>
                <p className="text-sm text-gray-500 mb-2">Status: <span className="text-green-600 font-medium">{selectedReport.content.incidentResponse.status}</span></p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Containment</h4>
                    <ul className="text-sm list-disc list-inside pl-2">
                      {selectedReport.content.incidentResponse.containment.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Eradication</h4>
                    <ul className="text-sm list-disc list-inside pl-2">
                      {selectedReport.content.incidentResponse.eradication.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-2">
                  <h4 className="text-sm font-semibold text-gray-700">Lessons Learned</h4>
                  <ul className="text-sm list-disc list-inside pl-2">
                    {selectedReport.content.incidentResponse.lessonsLearned.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Forensic Score & Risk Assessment */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">Forensic Score & Risk Assessment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-500">Forensic Score</p>
                    <p className="text-2xl font-bold text-green-700">{selectedReport.content.forensicScore.score}%</p>
                    <p className="text-sm text-green-600">{selectedReport.content.forensicScore.level} Level</p>
                    <ul className="text-xs mt-2 list-disc list-inside">
                      {selectedReport.content.forensicScore.factors.map((factor, i) => (
                        <li key={i}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-500">Risk Assessment</p>
                    <p className="text-2xl font-bold text-red-700">{selectedReport.content.riskAssessment.level}</p>
                    <p className="text-sm text-red-600">Score: {selectedReport.content.riskAssessment.score}/100</p>
                    <ul className="text-xs mt-2 list-disc list-inside">
                      {selectedReport.content.riskAssessment.factors.map((factor, i) => (
                        <li key={i}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">Recommendations</h3>
                {selectedReport.content.recommendations.map((r, i) => (
                  <div key={i} className="text-sm p-2 bg-blue-50 rounded text-blue-800 mt-1">• {r}</div>
                ))}
              </div>

              {/* Conclusion */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">Conclusion</h3>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">{selectedReport.content.conclusion}</p>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                <p>Generated by TraceLens AI © {new Date().getFullYear()} {selectedReport.organization.name}</p>
                <p>Digital Forensics Division • {selectedReport.organization.address}</p>
                <p>Report ID: {selectedReport.id} • Version: {selectedReport.version} • Status: {selectedReport.status}</p>
                <p>This report is confidential and intended for authorized use only.</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Select Case Modal - FIXED with proper key */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Select Case</h2>
              <button onClick={() => setShowCaseModal(false)} className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg">✕</button>
            </div>
            <div className="space-y-2">
              {cases.map((caseItem) => (
                <button
                  key={caseItem.id || caseItem.case_id}
                  onClick={() => {
                    setSelectedCaseId(caseItem.id);
                    setShowCaseModal(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    selectedCaseId === caseItem.id
                      ? "border-[#3B82F6] bg-[#3B82F6]/10"
                      : "border-[#1E293B] hover:border-[#3B82F6]/30 hover:bg-[#0B1220]"
                  }`}
                >
                  <p className="text-sm font-medium text-white">{caseItem.case_id} - {caseItem.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// REPORT HTML GENERATOR
// ============================================================

function generateReportHTML(r: Report): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${r.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; background: white; padding: 40px; color: #1a1a2e; }
    .container { max-width: 1100px; margin: 0 auto; }
    .header { text-align: center; padding: 40px 0; border-bottom: 3px solid #1a1a2e; margin-bottom: 30px; }
    .logo-container { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 4px; }
    .logo-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #3B82F6, #8B5CF6); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 800; flex-shrink: 0; }
    .logo-text { font-size: 32px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px; }
    .logo-text span { background: linear-gradient(135deg, #3B82F6, #8B5CF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .logo-tagline { font-size: 14px; color: #64748b; letter-spacing: 0.5px; font-weight: 500; }
    .org { font-size: 18px; color: #1a1a2e; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; background: #22c55e20; color: #22c55e; border: 1px solid #22c55e30; }
    .section { margin-bottom: 28px; }
    .section h2 { font-size: 18px; color: #1a1a2e; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 14px; }
    .section h3 { font-size: 15px; color: #1a1a2e; margin: 12px 0 6px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .field { padding: 6px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; }
    .field .label { color: #64748b; font-weight: 500; font-size: 13px; }
    .field .value { color: #1a1a2e; font-size: 13px; }
    .evidence-item { padding: 8px 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 4px; display: flex; justify-content: space-between; font-size: 13px; }
    .timeline-event { display: flex; gap: 12px; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
    .timeline-event .time { color: #64748b; font-weight: 600; width: 70px; flex-shrink: 0; font-size: 13px; }
    .timeline-event .event { flex: 1; font-size: 13px; }
    .timeline-event .event .title { font-weight: 600; }
    .timeline-event .event .desc { color: #64748b; font-size: 12px; }
    .finding { padding: 5px 12px; background: #f1f5f9; border-radius: 4px; margin: 3px 0; font-size: 13px; }
    .coc-item { padding: 8px 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 4px; display: flex; justify-content: space-between; font-size: 12px; }
    .signature-box { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 20px; border-top: 2px solid #e2e8f0; }
    .sig { text-align: center; }
    .sig .line { width: 180px; border-bottom: 1px solid #1a1a2e; margin: 6px auto; }
    .sig p { font-size: 13px; }
    .sig .title { color: #64748b; font-size: 12px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
    .declaration { padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #2563eb; margin: 12px 0; }
    .declaration p { font-size: 13px; color: #334155; line-height: 1.7; }
    .badge-standard { display: inline-block; padding: 2px 10px; background: #22c55e20; color: #22c55e; border-radius: 12px; font-size: 11px; font-weight: 600; margin: 2px; }
    .limitation { color: #dc2626; font-size: 13px; padding: 4px 0; }
    .ai-disclosure { padding: 12px 16px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #0ea5e9; }
    .summary-box { padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #2563eb; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .stat-item { padding: 12px; background: #f8fafc; border-radius: 8px; text-align: center; }
    .stat-item .number { font-size: 24px; font-weight: 700; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
<div class="container">

  <!-- Cover -->
  <div class="header">
    <div class="logo-container">
      <div class="logo-icon">🔍</div>
      <div class="logo-text">Trace<span>Lens</span> AI</div>
    </div>
    <div class="logo-tagline">AI-Powered Digital Investigation Platform</div>
    <div class="org">${r.organization.department}</div>
    <div style="color:#64748b;font-size:13px;margin-top:4px;">${r.organization.address}</div>
    <div style="color:#64748b;font-size:13px;">${r.organization.contact}</div>
    <div style="color:#64748b;font-size:12px;margin-top:4px;">${r.organization.accreditation}</div>
    <div style="font-size:22px;font-weight:700;color:#1a1a2e;margin-top:16px;">${r.title}</div>
    <div style="color:#64748b;font-size:14px;margin-top:4px;">Report ID: ${r.id} | Version: ${r.version}</div>
    <div style="color:#64748b;font-size:13px;">Generated: ${formatDate(r.generatedAt)}</div>
    <span class="badge">${r.status}</span>
  </div>

  <!-- A. Organization -->
  <div class="section">
    <h2>A. Organization Information</h2>
    <div class="grid-2">
      <div class="field"><span class="label">Organization</span><span class="value">${r.organization.name}</span></div>
      <div class="field"><span class="label">Department</span><span class="value">${r.organization.department}</span></div>
      <div class="field"><span class="label">Address</span><span class="value">${r.organization.address}</span></div>
      <div class="field"><span class="label">Contact</span><span class="value">${r.organization.contact}</span></div>
      <div class="field"><span class="label">Registration</span><span class="value">${r.organization.registrationNumber}</span></div>
      <div class="field"><span class="label">Accreditation</span><span class="value">${r.organization.accreditation}</span></div>
      <div class="field"><span class="label">Laboratory</span><span class="value">${r.organization.laboratoryName}</span></div>
      <div class="field"><span class="label">Template Version</span><span class="value">${r.organization.templateVersion}</span></div>
    </div>
  </div>

  <!-- B. Legal Authority -->
  <div class="section">
    <h2>B. Legal Authority</h2>
    <div class="grid-2">
      <div class="field"><span class="label">Type</span><span class="value">${r.legalAuthority.type}</span></div>
      <div class="field"><span class="label">Reference</span><span class="value">${r.legalAuthority.referenceNumber}</span></div>
      <div class="field"><span class="label">Issuing Authority</span><span class="value">${r.legalAuthority.issuingAuthority}</span></div>
      <div class="field"><span class="label">Date Issued</span><span class="value">${r.legalAuthority.dateIssued}</span></div>
      <div class="field"><span class="label">Valid Until</span><span class="value">${r.legalAuthority.validUntil}</span></div>
      <div class="field"><span class="label">Jurisdiction</span><span class="value">${r.legalAuthority.jurisdiction}</span></div>
      <div class="field"><span class="label">Authorized Officer</span><span class="value">${r.legalAuthority.authorizedOfficer}</span></div>
    </div>
  </div>

  <!-- C. Investigation Request -->
  <div class="section">
    <h2>C. Investigation Request</h2>
    <div class="field"><span class="label">Requested By</span><span class="value">${r.requestedBy}</span></div>
    <div class="field"><span class="label">Organization</span><span class="value">${r.requestOrganization}</span></div>
    <div class="field"><span class="label">Request Date</span><span class="value">${r.requestDate}</span></div>
    <div class="field"><span class="label">Reason</span><span class="value">${r.requestReason}</span></div>
    <div style="margin-top:8px;"><span class="label">Objectives:</span></div>
    <ul style="margin-left:20px;font-size:13px;color:#1a1a2e;">
      ${r.requestObjectives.map(o => `<li>${o}</li>`).join('')}
    </ul>
  </div>

  <!-- D. Investigator -->
  <div class="section">
    <h2>D. Investigator Declaration</h2>
    <div class="grid-2">
      <div class="field"><span class="label">Name</span><span class="value">${r.investigator.name}</span></div>
      <div class="field"><span class="label">Designation</span><span class="value">${r.investigator.designation}</span></div>
      <div class="field"><span class="label">Experience</span><span class="value">${r.investigator.experience}</span></div>
      <div class="field"><span class="label">Certification</span><span class="value">${r.investigator.certification}</span></div>
      <div class="field"><span class="label">Organization</span><span class="value">${r.investigator.organization}</span></div>
    </div>
  </div>

  <!-- E. Evidence Collection -->
  <div class="section">
    <h2>E. Evidence Collection Authorization</h2>
    <div class="grid-2">
      <div class="field"><span class="label">Collector</span><span class="value">${r.evidenceCollection.collector}</span></div>
      <div class="field"><span class="label">Witness</span><span class="value">${r.evidenceCollection.witness}</span></div>
      <div class="field"><span class="label">Method</span><span class="value">${r.evidenceCollection.collectionMethod}</span></div>
      <div class="field"><span class="label">Permission</span><span class="value">${r.evidenceCollection.permission}</span></div>
      <div class="field"><span class="label">Location</span><span class="value">${r.evidenceCollection.location}</span></div>
      <div class="field"><span class="label">Date</span><span class="value">${r.evidenceCollection.date}</span></div>
      <div class="field"><span class="label">Time</span><span class="value">${r.evidenceCollection.time}</span></div>
      <div class="field"><span class="label">Device</span><span class="value">${r.evidenceCollection.deviceDetails}</span></div>
    </div>
  </div>

  <!-- F. Methodology -->
  <div class="section">
    <h2>F. Methodology</h2>
    <ul style="margin-left:20px;font-size:13px;color:#1a1a2e;">
      ${r.methodology.map(m => `<li>${m}</li>`).join('')}
    </ul>
  </div>

  <!-- G. Standards -->
  <div class="section">
    <h2>G. Standards Followed</h2>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">
      ${r.standards.map(s => `<span class="badge-standard">✓ ${s}</span>`).join('')}
    </div>
  </div>

  <!-- H. Evidence Preservation -->
  <div class="section">
    <h2>H. Evidence Preservation</h2>
    <div class="grid-2">
      <div class="field"><span class="label">Storage</span><span class="value">${r.evidenceStored}</span></div>
      <div class="field"><span class="label">Location</span><span class="value">${r.storageLocation}</span></div>
      <div class="field"><span class="label">Locker</span><span class="value">${r.evidenceLocker}</span></div>
      <div class="field"><span class="label">Cloud</span><span class="value">${r.cloudStorage}</span></div>
      <div class="field"><span class="label">Encryption</span><span class="value">${r.encryption}</span></div>
      <div class="field"><span class="label">Hash Verified</span><span class="value">${r.hashVerified ? '✅ Yes' : '❌ No'}</span></div>
      <div class="field"><span class="label">Backup</span><span class="value">${r.backupAvailable ? '✅ Available' : '❌ Not Available'}</span></div>
    </div>
  </div>

  <!-- I. Chain of Custody -->
  <div class="section">
    <h2>I. Chain of Custody</h2>
    ${r.chainOfCustody.map(coc => `
      <div class="coc-item">
        <span>${coc.from} → ${coc.to}</span>
        <span style="color:#64748b;">${coc.date} ${coc.time} • ${coc.reason}</span>
      </div>
    `).join('')}
  </div>

  <!-- J. Executive Summary -->
  <div class="section">
    <h2>J. Executive Summary</h2>
    <div class="summary-box">
      <p style="font-size:14px;color:#1a1a2e;white-space:pre-wrap;line-height:1.7;">${r.content.executiveSummary}</p>
    </div>
  </div>

  <!-- K. Expert Opinion -->
  <div class="section">
    <h2>K. Expert Opinion</h2>
    <div class="declaration" style="border-left-color:#8b5cf6;">
      <p>${r.expertOpinion}</p>
    </div>
  </div>

  <!-- L. Limitations -->
  <div class="section">
    <h2>L. Limitations</h2>
    ${r.limitations.map(l => `<div class="limitation">• ${l}</div>`).join('')}
  </div>

  <!-- M. Legal Declaration -->
  <div class="section">
    <h2>M. Legal Declaration</h2>
    <div class="declaration">
      <p>${r.legalDeclaration}</p>
    </div>
  </div>

  <!-- N. AI Disclosure -->
  <div class="section">
    <h2>N. AI Disclosure</h2>
    <div class="ai-disclosure">
      <p style="font-size:13px;color:#1a1a2e;font-weight:600;">AI was used to assist in:</p>
      <ul style="margin:6px 0 0 20px;color:#334155;font-size:13px;">
        ${r.aiDisclosure.modules.map(m => `<li>${m}</li>`).join('')}
      </ul>
      <p style="font-size:13px;color:#1a1a2e;margin-top:6px;">✅ Reviewed by investigator: ${r.aiDisclosure.reviewedByInvestigator ? 'Yes' : 'No'}</p>
      <p style="font-size:13px;color:#1a1a2e;">Confidence: ${r.aiDisclosure.confidence}</p>
    </div>
  </div>

  <!-- O. Signatures -->
  <div class="section">
    <h2>O. Signatures</h2>
    <div class="signature-box">
      <div class="sig">
        <p style="font-weight:600;">${r.signatures.leadInvestigator}</p>
        <div class="line"></div>
        <p class="title">Lead Investigator</p>
        <p style="color:#64748b;font-size:12px;">${r.signatures.leadDate}</p>
      </div>
      <div class="sig">
        <p style="font-weight:600;">${r.signatures.reviewer}</p>
        <div class="line"></div>
        <p class="title">Reviewer</p>
        <p style="color:#64748b;font-size:12px;">${r.signatures.reviewDate}</p>
      </div>
      <div class="sig">
        <p style="font-weight:600;">${r.signatures.laboratoryManager}</p>
        <div class="line"></div>
        <p class="title">Laboratory Manager</p>
        <p style="color:#64748b;font-size:12px;">${r.signatures.labManagerDate}</p>
      </div>
    </div>
  </div>

  <!-- Evidence Summary -->
  <div class="section">
    <h2>Evidence Summary</h2>
    <p style="color:#64748b;font-size:13px;margin-bottom:8px;">Total: ${r.content.evidenceSummary.total} items</p>
    ${r.content.evidenceSummary.items.map(item => `
      <div class="evidence-item">
        <span>${item.name}</span>
        <span style="color:#64748b;">${item.type} • ${item.size}</span>
      </div>
    `).join('')}
  </div>

  <!-- Metadata Analysis -->
  <div class="section">
    <h2>Metadata Analysis</h2>
    <p style="color:#64748b;font-size:13px;margin-bottom:4px;">Files Analyzed: ${r.content.metadataAnalysis.filesAnalyzed}</p>
    <p style="font-size:13px;color:#1a1a2e;background:#f8fafc;padding:12px;border-radius:8px;margin-bottom:8px;">${r.content.metadataAnalysis.summary}</p>
    ${r.content.metadataAnalysis.findings.map(f => `
      <div style="padding:4px 12px;background:#eff6ff;border-radius:4px;margin:3px 0;font-size:13px;color:#1e40af;">• ${f}</div>
    `).join('')}
  </div>

  <!-- Timeline -->
  <div class="section">
    <h2>Investigation Timeline</h2>
    ${r.content.timeline.map(day => `
      <h3 style="margin-top:10px;color:#2563eb;font-size:14px;">${day.date}</h3>
      ${day.events.map(event => `
        <div class="timeline-event">
          <span class="time">${event.time}</span>
          <div class="event">
            <div class="title">${event.event}</div>
            <div class="desc">${event.description}</div>
          </div>
        </div>
      `).join('')}
    `).join('')}
  </div>

  <!-- Log Analysis -->
  <div class="section">
    <h2>Log Analysis</h2>
    <div class="stat-grid">
      <div class="stat-item"><span style="color:#64748b;">Total Lines</span><div class="number">${r.content.logAnalysis.totalLines}</div></div>
      <div class="stat-item" style="background:#fef3c7;"><span style="color:#d97706;">Suspicious</span><div class="number" style="color:#d97706;">${r.content.logAnalysis.suspicious}</div></div>
      <div class="stat-item" style="background:#fee2e2;"><span style="color:#dc2626;">Threats</span><div class="number" style="color:#dc2626;">${r.content.logAnalysis.threats}</div></div>
    </div>
    <p style="font-size:13px;color:#1a1a2e;background:#f8fafc;padding:12px;border-radius:8px;margin:8px 0;">${r.content.logAnalysis.summary}</p>
    ${r.content.logAnalysis.findings.map(f => `
      <div style="padding:4px 12px;background:#fee2e2;border-radius:4px;margin:3px 0;font-size:13px;color:#991b1b;">• ${f}</div>
    `).join('')}
  </div>

  <!-- Email Analysis -->
  <div class="section">
    <h2>Email Analysis</h2>
    <div class="stat-grid">
      <div class="stat-item"><span style="color:#64748b;">Total Analyzed</span><div class="number">${r.content.emailAnalysis.totalAnalyzed}</div></div>
      <div class="stat-item" style="background:#fee2e2;"><span style="color:#dc2626;">Suspicious</span><div class="number" style="color:#dc2626;">${r.content.emailAnalysis.suspicious}</div></div>
    </div>
    <p style="font-size:13px;color:#1a1a2e;background:#f8fafc;padding:12px;border-radius:8px;margin:8px 0;">${r.content.emailAnalysis.summary}</p>
    ${r.content.emailAnalysis.findings.map(f => `
      <div style="padding:4px 12px;background:#fee2e2;border-radius:4px;margin:3px 0;font-size:13px;color:#991b1b;">• ${f}</div>
    `).join('')}
  </div>

  <!-- OSINT Findings -->
  <div class="section">
    <h2>OSINT Findings</h2>
    <p style="color:#64748b;font-size:13px;">Searches Performed: ${r.content.osintFindings.searchesPerformed}</p>
    <p style="font-size:13px;color:#1a1a2e;background:#f8fafc;padding:12px;border-radius:8px;margin:8px 0;">${r.content.osintFindings.summary}</p>
    ${r.content.osintFindings.findings.map(f => `
      <div style="padding:4px 12px;background:#eff6ff;border-radius:4px;margin:3px 0;font-size:13px;color:#1e40af;">• ${f}</div>
    `).join('')}
  </div>

  <!-- Incident Response -->
  <div class="section">
    <h2>Incident Response</h2>
    <p style="color:#64748b;font-size:13px;">Plan Applied: ${r.content.incidentResponse.planApplied}</p>
    <p style="color:#16a34a;font-size:13px;font-weight:600;margin-bottom:8px;">Status: ${r.content.incidentResponse.status}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div>
        <h3 style="font-size:13px;font-weight:600;color:#1a1a2e;">Containment</h3>
        <ul style="margin-left:20px;font-size:12px;">
          ${r.content.incidentResponse.containment.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      <div>
        <h3 style="font-size:13px;font-weight:600;color:#1a1a2e;">Eradication</h3>
        <ul style="margin-left:20px;font-size:12px;">
          ${r.content.incidentResponse.eradication.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    </div>
    <h3 style="font-size:13px;font-weight:600;color:#1a1a2e;margin-top:8px;">Lessons Learned</h3>
    <ul style="margin-left:20px;font-size:12px;">
      ${r.content.incidentResponse.lessonsLearned.map(item => `<li>${item}</li>`).join('')}
    </ul>
  </div>

  <!-- Forensic Score & Risk -->
  <div class="section">
    <h2>Forensic Score & Risk Assessment</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div style="padding:16px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
        <p style="color:#64748b;font-size:13px;">Forensic Score</p>
        <p style="font-size:28px;font-weight:700;color:#16a34a;">${r.content.forensicScore.score}%</p>
        <p style="color:#16a34a;font-size:13px;font-weight:600;">${r.content.forensicScore.level} Level</p>
        <ul style="margin-top:8px;font-size:12px;list-style:disc;padding-left:16px;">
          ${r.content.forensicScore.factors.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
      <div style="padding:16px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca;">
        <p style="color:#64748b;font-size:13px;">Risk Assessment</p>
        <p style="font-size:28px;font-weight:700;color:#dc2626;">${r.content.riskAssessment.level}</p>
        <p style="color:#dc2626;font-size:13px;">Score: ${r.content.riskAssessment.score}/100</p>
        <ul style="margin-top:8px;font-size:12px;list-style:disc;padding-left:16px;">
          ${r.content.riskAssessment.factors.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    </div>
  </div>

  <!-- Recommendations -->
  <div class="section">
    <h2>Recommendations</h2>
    ${r.content.recommendations.map(rec => `<div class="finding">• ${rec}</div>`).join('')}
  </div>

  <!-- Conclusion -->
  <div class="section">
    <h2>Conclusion</h2>
    <div style="padding:16px;background:#f8fafc;border-radius:8px;">
      <p style="color:#334155;line-height:1.7;font-size:14px;">${r.content.conclusion}</p>
    </div>
  </div>

  <div class="footer">
    <p>${r.organization.name} • ${r.organization.department}</p>
    <p>Report ID: ${r.id} • Version: ${r.version} • Status: ${r.status}</p>
    <p>Generated by TraceLens AI © ${new Date().getFullYear()} ${r.organization.name}</p>
    <p style="font-size:10px;color:#94a3b8;margin-top:4px;">This report is confidential and intended for authorized use only.</p>
  </div>

</div>
</body>
</html>`;
}