// ============================================================
// TraceLens AI - Professional Forensic Scoring Framework
// For Digital Forensics & Investigation Platform
// Following: ISO/IEC 27037, 27041, 27042, 27043, NIST SP 800-86
// ============================================================

// ============================================================
// 1. Evidence Integrity Score (EIS)
// ============================================================
export interface EvidenceIntegrityScore {
  score: number;
  level: "Excellent" | "Good" | "Satisfactory" | "Needs Review" | "Compromised";
  status: "Verified" | "Modified" | "Corrupted" | "Unknown";
  hashVerified: boolean;
  chainOfCustodyVerified: boolean;
  details: string[];
}

export function calculateEvidenceIntegrity(
  hashStatus: "Verified" | "Modified" | "Corrupted" | "Unknown",
  custodyVerified: boolean,
  fileCount: number
): EvidenceIntegrityScore {
  let baseScore = 0;
  
  // Hash verification (50%)
  switch (hashStatus) {
    case "Verified": baseScore += 50; break;
    case "Unknown": baseScore += 25; break;
    case "Modified": baseScore += 10; break;
    case "Corrupted": baseScore += 0; break;
  }
  
  // Chain of custody (30%)
  baseScore += custodyVerified ? 30 : 10;
  
  // File count consistency (20%)
  if (fileCount > 0) {
    baseScore += Math.min(fileCount * 2, 20);
  }
  
  const score = Math.min(baseScore, 100);
  
  let level: EvidenceIntegrityScore["level"];
  if (score >= 90) level = "Excellent";
  else if (score >= 75) level = "Good";
  else if (score >= 60) level = "Satisfactory";
  else if (score >= 40) level = "Needs Review";
  else level = "Compromised";

  return {
    score,
    level,
    status: hashStatus,
    hashVerified: hashStatus === "Verified",
    chainOfCustodyVerified: custodyVerified,
    details: [
      `Hash verification: ${hashStatus}`,
      `Chain of custody: ${custodyVerified ? "Verified" : "Incomplete"}`,
      `Total evidence files: ${fileCount}`,
    ],
  };
}

// ============================================================
// 2. Chain of Custody Score (CCS)
// ============================================================
export interface ChainOfCustodyScore {
  score: number;
  level: "Complete" | "Verified" | "Partial" | "Incomplete" | "Broken";
  status: "Complete" | "Verified" | "In Progress" | "Missing Information" | "Broken Chain";
  details: string[];
}

export function calculateChainOfCustody(
  status: "Complete" | "Verified" | "In Progress" | "Missing Information" | "Broken Chain",
  collectionDate: string | null,
  collectedBy: string | null,
  transfers: number
): ChainOfCustodyScore {
  let score = 0;
  
  // Status weight (50%)
  switch (status) {
    case "Complete": score += 50; break;
    case "Verified": score += 40; break;
    case "In Progress": score += 25; break;
    case "Missing Information": score += 10; break;
    case "Broken Chain": score += 0; break;
  }
  
  // Collection information (30%)
  if (collectionDate && collectedBy) score += 30;
  else if (collectionDate || collectedBy) score += 15;
  
  // Transfer history (20%)
  if (transfers >= 0) {
    score += Math.min(transfers * 5, 20);
  }
  
  const finalScore = Math.min(score, 100);
  
  let level: ChainOfCustodyScore["level"];
  if (finalScore >= 90) level = "Complete";
  else if (finalScore >= 75) level = "Verified";
  else if (finalScore >= 60) level = "Partial";
  else if (finalScore >= 40) level = "Incomplete";
  else level = "Broken";

  return {
    score: finalScore,
    level,
    status,
    details: [
      `Custody status: ${status}`,
      `Collection date: ${collectionDate || "Not recorded"}`,
      `Collected by: ${collectedBy || "Not recorded"}`,
      `Number of transfers: ${transfers}`,
    ],
  };
}

// ============================================================
// 3. Metadata Confidence Score (MCS)
// ============================================================
export interface MetadataConfidenceScore {
  score: number;
  level: "High" | "Moderate" | "Low" | "Insufficient";
  status: "Complete" | "Partial" | "Missing" | "Modified" | "Suspicious";
  details: string[];
}

export function calculateMetadataConfidence(
  extractedFields: number,
  totalFields: number,
  modifiedFields: number,
  suspiciousFields: number
): MetadataConfidenceScore {
  const percentage = totalFields > 0 ? (extractedFields / totalFields) * 100 : 0;
  const modifiedPercentage = totalFields > 0 ? (modifiedFields / totalFields) * 100 : 0;
  const suspiciousPercentage = totalFields > 0 ? (suspiciousFields / totalFields) * 100 : 0;
  
  let score = percentage * 0.6; // 60% for completeness
  score -= modifiedPercentage * 0.3; // -30% for modifications
  score -= suspiciousPercentage * 0.4; // -40% for suspicious fields
  score = Math.max(0, Math.min(100, score));
  
  let level: MetadataConfidenceScore["level"];
  if (score >= 80) level = "High";
  else if (score >= 60) level = "Moderate";
  else if (score >= 40) level = "Low";
  else level = "Insufficient";
  
  let status: MetadataConfidenceScore["status"];
  if (percentage >= 90) status = "Complete";
  else if (percentage >= 60) status = "Partial";
  else if (modifiedFields > 0) status = "Modified";
  else if (suspiciousFields > 0) status = "Suspicious";
  else status = "Missing";

  return {
    score: Math.round(score * 10) / 10,
    level,
    status,
    details: [
      `Extracted fields: ${extractedFields}/${totalFields}`,
      `Modified fields: ${modifiedFields}`,
      `Suspicious fields: ${suspiciousFields}`,
      `Completeness: ${Math.round(percentage)}%`,
    ],
  };
}

// ============================================================
// 4. Source Reliability Score (SRS)
// ============================================================
export interface SourceReliabilityScore {
  score: number;
  rating: "A" | "B" | "C" | "D" | "E";
  level: "Very Reliable" | "Reliable" | "Partially Reliable" | "Unreliable" | "Unknown";
  details: string[];
}

export function calculateSourceReliability(
  verifiedSources: number,
  totalSources: number,
  trustScore: number
): SourceReliabilityScore {
  const verificationRatio = totalSources > 0 ? verifiedSources / totalSources : 0;
  const score = (verificationRatio * 60) + (trustScore * 0.4);
  const finalScore = Math.min(100, Math.max(0, score));
  
  let rating: SourceReliabilityScore["rating"];
  let level: SourceReliabilityScore["level"];
  
  if (finalScore >= 90) {
    rating = "A";
    level = "Very Reliable";
  } else if (finalScore >= 75) {
    rating = "B";
    level = "Reliable";
  } else if (finalScore >= 60) {
    rating = "C";
    level = "Partially Reliable";
  } else if (finalScore >= 40) {
    rating = "D";
    level = "Unreliable";
  } else {
    rating = "E";
    level = "Unknown";
  }

  return {
    score: Math.round(finalScore * 10) / 10,
    rating,
    level,
    details: [
      `Verified sources: ${verifiedSources}/${totalSources}`,
      `Trust score: ${Math.round(trustScore)}%`,
      `Reliability: ${level}`,
    ],
  };
}

// ============================================================
// 5. AI Confidence Score (AICS)
// ============================================================
export interface AIConfidenceScore {
  score: number;
  level: "Very High" | "High" | "Moderate" | "Low" | "Needs Human Review";
  disclaimer: string;
  details: string[];
}

export const AI_DISCLAIMER = 
  "This AI analysis is advisory and must be reviewed by a qualified investigator.";

export function calculateAIConfidence(
  confidenceScore: number,
  supportingEvidence: string[],
  hasHumanReview: boolean
): AIConfidenceScore {
  const score = Math.min(100, Math.max(0, confidenceScore));
  
  let level: AIConfidenceScore["level"];
  if (score >= 95) level = "Very High";
  else if (score >= 85) level = "High";
  else if (score >= 70) level = "Moderate";
  else if (score >= 50) level = "Low";
  else level = "Needs Human Review";

  return {
    score,
    level,
    disclaimer: AI_DISCLAIMER,
    details: [
      `Confidence: ${score}%`,
      `Supporting evidence: ${supportingEvidence.length} items`,
      `Human review: ${hasHumanReview ? "Completed" : "Required"}`,
      `Level: ${level}`,
    ],
  };
}

// ============================================================
// 6. Investigation Confidence Index (ICI) - Your Custom Metric
// ============================================================
export interface ICIMetrics {
  evidenceIntegrity: EvidenceIntegrityScore;
  chainOfCustody: ChainOfCustodyScore;
  metadataConfidence: MetadataConfidenceScore;
  sourceReliability: SourceReliabilityScore;
  aiConfidence: AIConfidenceScore;
}

export interface ICIResult {
  score: number;
  rating: "Excellent" | "High" | "Moderate" | "Low" | "Insufficient";
  metrics: ICIMetrics;
  recommendations: string[];
  summary: string;
}

export function calculateICI(metrics: ICIMetrics): ICIResult {
  // Weighted scoring
  const weights = {
    evidenceIntegrity: 0.30,
    chainOfCustody: 0.25,
    metadataConfidence: 0.20,
    sourceReliability: 0.15,
    aiConfidence: 0.10,
  };

  const totalScore = 
    (metrics.evidenceIntegrity.score * weights.evidenceIntegrity) +
    (metrics.chainOfCustody.score * weights.chainOfCustody) +
    (metrics.metadataConfidence.score * weights.metadataConfidence) +
    (metrics.sourceReliability.score * weights.sourceReliability) +
    (metrics.aiConfidence.score * weights.aiConfidence);

  let rating: ICIResult["rating"];
  if (totalScore >= 90) rating = "Excellent";
  else if (totalScore >= 75) rating = "High";
  else if (totalScore >= 60) rating = "Moderate";
  else if (totalScore >= 40) rating = "Low";
  else rating = "Insufficient";

  const recommendations: string[] = [];
  if (metrics.evidenceIntegrity.score < 75) {
    recommendations.push("Improve evidence integrity verification");
  }
  if (metrics.chainOfCustody.score < 75) {
    recommendations.push("Complete chain of custody documentation");
  }
  if (metrics.metadataConfidence.score < 60) {
    recommendations.push("Extract and verify more metadata fields");
  }
  if (metrics.sourceReliability.score < 60) {
    recommendations.push("Verify sources through multiple channels");
  }
  if (metrics.aiConfidence.score < 70) {
    recommendations.push("Perform human review of AI findings");
  }

  let summary = "";
  if (rating === "Excellent") {
    summary = "Investigation has strong, verified evidence with complete chain of custody and high confidence.";
  } else if (rating === "High") {
    summary = "Investigation has reliable evidence with minor gaps that need attention.";
  } else if (rating === "Moderate") {
    summary = "Investigation has useful evidence but requires further verification.";
  } else if (rating === "Low") {
    summary = "Investigation has weak evidence requiring significant additional work.";
  } else {
    summary = "Investigation has insufficient evidence for reliable conclusions.";
  }

  return {
    score: Math.round(totalScore * 10) / 10,
    rating,
    metrics,
    recommendations,
    summary,
  };
}

// ============================================================
// 7. Threat Severity (for Investigations)
// ============================================================
export type ThreatSeverity = "Informational" | "Low" | "Medium" | "High" | "Critical";

export const THREAT_SEVERITY_COLORS: Record<ThreatSeverity, string> = {
  Informational: "#3B82F6",
  Low: "#22C55E",
  Medium: "#F59E0B",
  High: "#F97316",
  Critical: "#EF4444",
};

export const THREAT_SEVERITY_BADGES: Record<ThreatSeverity, string> = {
  Informational: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Low: "bg-green-500/20 text-green-400 border border-green-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  High: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  Critical: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export interface ThreatAssessment {
  severity: ThreatSeverity;
  score: number;
  description: string;
  indicators: string[];
  recommendations: string[];
}

// ============================================================
// 8. Investigation Status
// ============================================================
export type InvestigationStatus = 
  | "New"
  | "Open"
  | "Assigned"
  | "Evidence Collection"
  | "Analysis"
  | "Pending Review"
  | "Report Generated"
  | "Closed"
  | "Archived";

// ============================================================
// 9. Compliance Standards
// ============================================================
export interface ComplianceStandards {
  iso27037: boolean;  // Identification, Collection, Acquisition, Preservation
  iso27041: boolean;  // Investigation assurance
  iso27042: boolean;  // Analysis and interpretation
  iso27043: boolean;  // Incident investigation
  nist80086: boolean; // Guide to Integrating Forensic Techniques
  swgde: boolean;     // Scientific Working Group on Digital Evidence
  acpo: boolean;      // ACPO Principles (UK)
  rfc3227: boolean;   // Evidence collection order
}

export const COMPLIANCE_LABELS: Record<keyof ComplianceStandards, string> = {
  iso27037: "ISO/IEC 27037",
  iso27041: "ISO/IEC 27041",
  iso27042: "ISO/IEC 27042",
  iso27043: "ISO/IEC 27043",
  nist80086: "NIST SP 800-86",
  swgde: "SWGDE Best Practices",
  acpo: "ACPO Principles",
  rfc3227: "RFC 3227",
};

// ============================================================
// 10. Complete Investigation Quality Report
// ============================================================
export interface InvestigationQualityReport {
  investigationId: string;
  caseId: string;
  title: string;
  status: InvestigationStatus;
  threatSeverity: ThreatSeverity;
  ici: ICIResult;
  evidenceIntegrity: EvidenceIntegrityScore;
  chainOfCustody: ChainOfCustodyScore;
  metadataConfidence: MetadataConfidenceScore;
  sourceReliability: SourceReliabilityScore;
  aiConfidence: AIConfidenceScore;
  compliance: ComplianceStandards;
  generatedAt: string;
  generatedBy: string;
}

export function generateInvestigationQualityReport(
  caseId: string,
  title: string,
  status: InvestigationStatus,
  threatSeverity: ThreatSeverity,
  metrics: ICIMetrics,
  compliance: ComplianceStandards,
  investigator: string
): InvestigationQualityReport {
  const ici = calculateICI(metrics);
  
  return {
    investigationId: `INV-${Date.now().toString().slice(-6)}`,
    caseId,
    title,
    status,
    threatSeverity,
    ici,
    evidenceIntegrity: metrics.evidenceIntegrity,
    chainOfCustody: metrics.chainOfCustody,
    metadataConfidence: metrics.metadataConfidence,
    sourceReliability: metrics.sourceReliability,
    aiConfidence: metrics.aiConfidence,
    compliance,
    generatedAt: new Date().toISOString(),
    generatedBy: investigator,
  };
}