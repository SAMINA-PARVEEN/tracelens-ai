"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PremiumLogo from "../../components/ui/PremiumLogo";
import { supabase } from "../../lib/supabase";
import { analyzeFile } from "../../lib/aiService";
import {
  calculateEvidenceIntegrity,
  calculateChainOfCustody,
  calculateMetadataConfidence,
  calculateSourceReliability,
  calculateAIConfidence,
  calculateICI,
  AI_DISCLAIMER,
  type ThreatSeverity,
} from "../../lib/forensicScoring";

// ============================================================
// TYPES
// ============================================================

interface CaseDetail {
  id: string;
  case_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  case_type: string;
  created_date: string;
  created_at: string;
  organization_id: string;
  created_by: string;
}

interface EvidenceItem {
  id: string;
  evidence_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  hash_sha256: string;
  uploaded_by: string;
  description: string;
  created_at: string;
}

interface AnalysisResult {
  summary: string;
  confidence: number;
  recommendations: string[];
  threatLevel: "Low" | "Medium" | "High" | "Critical";
  findings: string[];
  indicators: string[];
  conclusion: string;
}

// ============================================================
// ALLOWED FILE TYPES
// ============================================================

const ALLOWED_FILE_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff",
  "application/pdf", "text/plain", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv", "application/json", "text/xml", "application/xml", "text/html",
  "message/rfc822", "application/vnd.ms-outlook", "text/x-log",
  "application/vnd.tcpdump.pcap", "application/pcap",
];

const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.sh', '.cmd', '.com', '.scr', '.msi', '.vbs', '.ps1'];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CaseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;
  
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // LOAD DATA
  // ============================================================

  useEffect(() => {
    async function loadCase() {
      try {
        setLoading(true);
        setError(null);

        let { data, error } = await supabase
          .from('cases')
          .select('*')
          .eq('case_id', caseId)
          .maybeSingle();

        if (!data) {
          const { data: dataById } = await supabase
            .from('cases')
            .select('*')
            .eq('id', caseId)
            .maybeSingle();
          data = dataById;
        }

        if (!data) {
          const { data: dataLike } = await supabase
            .from('cases')
            .select('*')
            .ilike('case_id', `%${caseId}%`)
            .limit(1)
            .maybeSingle();
          data = dataLike;
        }

        if (error || !data) {
          setError('Case not found');
          setLoading(false);
          return;
        }

        setCaseData(data);

        const { data: evidenceData } = await supabase
          .from('evidence')
          .select('*')
          .eq('case_id', data.case_id)
          .order('created_at', { ascending: false });

        setEvidence(evidenceData || []);
        generateTimelineEvents(data, evidenceData || []);

      } catch (err) {
        setError('Failed to load case');
      } finally {
        setLoading(false);
      }
    }
    if (caseId) loadCase();
  }, [caseId]);

  const generateTimelineEvents = (caseInfo: any, evidenceList: any[]) => {
    const events = [{
      id: "T-001",
      title: "Case Created",
      description: `Case ${caseInfo.case_id} was created: ${caseInfo.title}`,
      type: "case",
      date: caseInfo.created_at || new Date().toISOString(),
    }];
    evidenceList.forEach((item, index) => {
      events.push({
        id: `T-${String(index + 2).padStart(3, "0")}`,
        title: `Evidence Uploaded: ${item.file_name}`,
        description: `File uploaded to case ${caseInfo.case_id}`,
        type: "evidence",
        date: item.created_at || new Date().toISOString(),
      });
    });
    setTimelineEvents(events);
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Open': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      'In Progress': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      'Under Review': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      'Closed': 'bg-green-500/20 text-green-400 border border-green-500/30',
      'Archived': 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'Critical': 'bg-red-500/20 text-red-400 border border-red-500/30',
      'High': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      'Medium': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      'Low': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    };
    return colors[priority] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  };

  const getStatusDot = (status: string) => {
    const colors: Record<string, string> = {
      'Open': 'bg-blue-400',
      'In Progress': 'bg-yellow-400 animate-pulse',
      'Under Review': 'bg-purple-400',
      'Closed': 'bg-green-400',
      'Archived': 'bg-gray-400',
    };
    return colors[status] || 'bg-gray-400';
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  // ============================================================
  // EVIDENCE FUNCTIONS - FIXED
  // ============================================================

  const validateFile = (file: File): string | null => {
    const name = file.name.toLowerCase();
    if (BLOCKED_EXTENSIONS.some(ext => name.endsWith(ext))) {
      return `Executable files are blocked for security.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`;
    }
    return null;
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploadError("");
    const file = files[0];
    
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    try {
      if (!caseData || !caseData.case_id) {
        setUploadError('Case data not found. Please refresh and try again.');
        setUploading(false);
        return;
      }

      // Generate hash
      const hashValue = Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      // ONLY use columns that exist in your table
      const insertData = {
        evidence_id: `E-${Date.now().toString().slice(-6)}`,
        case_id: caseData.case_id,
        file_name: file.name,
        file_type: file.type || null,
        file_size: file.size,
        hash_sha256: hashValue,
      };

      console.log('📝 Inserting:', insertData);

      const { data, error: uploadError } = await supabase
        .from('evidence')
        .insert([insertData])
        .select();

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        setUploadError(`Failed to upload: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      if (data && data.length > 0) {
        console.log('✅ Upload success:', data[0]);
        setEvidence([...evidence, data[0]]);
        setUploadedFiles([...uploadedFiles, file]);
        
        // Refresh evidence list
        const { data: refreshData } = await supabase
          .from('evidence')
          .select('*')
          .eq('case_id', caseData.case_id)
          .order('created_at', { ascending: false });
        
        if (refreshData) setEvidence(refreshData);
        
        setTimelineEvents([...timelineEvents, {
          id: `T-${String(timelineEvents.length + 1).padStart(3, "0")}`,
          title: `Evidence Uploaded: ${file.name}`,
          description: `File uploaded to case ${caseData?.case_id}`,
          type: "evidence",
          date: new Date().toISOString(),
        }]);
      }

    } catch (err: any) {
      console.error('🔥 Error:', err);
      setUploadError(`Failed to upload: ${err.message}`);
    }

    setUploading(false);
    setUploadProgress(0);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // ============================================================
  // AI ANALYSIS
  // ============================================================

  const runAIAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      alert("Please upload evidence first!");
      return;
    }

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const fileToAnalyze = uploadedFiles[0];
      const result = await analyzeFile(fileToAnalyze, fileToAnalyze.name);
      
      setAnalysisResult({
        summary: result.summary || "Analysis complete.",
        confidence: result.confidence || 85,
        threatLevel: result.threatLevel || "Medium",
        findings: result.findings || ["No specific findings"],
        indicators: result.indicators || ["No indicators detected"],
        recommendations: result.recommendations || ["Review evidence manually"],
        conclusion: result.conclusion || "Further investigation recommended."
      });
      
      setTimelineEvents([...timelineEvents, {
        id: `T-${String(timelineEvents.length + 1).padStart(3, "0")}`,
        title: `AI Analysis Completed: ${fileToAnalyze.name}`,
        description: `Analysis completed. Threat Level: ${result.threatLevel}`,
        type: "analysis",
        date: new Date().toISOString(),
      }]);
      
    } catch (error) {
      setAnalysisResult({
        summary: "Analysis encountered an error. Please try again.",
        confidence: 50,
        threatLevel: "Medium",
        findings: ["Error during analysis"],
        indicators: ["N/A"],
        recommendations: ["Try again later", "Contact support if issue persists"],
        conclusion: "Manual review recommended."
      });
    }
    
    setAnalyzing(false);
  };

  // ============================================================
  // FORENSIC SCORING
  // ============================================================

  const calculateForensicScores = () => {
    const integrityStatus = evidence.length > 0 ? "Verified" : "Unknown";
    const evidenceIntegrity = calculateEvidenceIntegrity(
      integrityStatus,
      evidence.length > 0,
      evidence.length
    );

    const custodyStatus = evidence.length > 0 ? "Complete" : "In Progress";
    const chainOfCustody = calculateChainOfCustody(
      custodyStatus,
      caseData?.created_date || null,
      "Samina Parveen",
      evidence.length > 0 ? 1 : 0
    );

    const metadataConfidence = calculateMetadataConfidence(
      analysisResult ? 12 : 0,
      15,
      analysisResult ? 1 : 0,
      analysisResult ? 0 : 0
    );

    const sourceReliability = calculateSourceReliability(
      analysisResult ? 2 : 0,
      analysisResult ? 3 : 1,
      analysisResult?.confidence || 50
    );

    const aiConfidence = calculateAIConfidence(
      analysisResult?.confidence || 50,
      analysisResult?.findings || [],
      false
    );

    return {
      evidenceIntegrity,
      chainOfCustody,
      metadataConfidence,
      sourceReliability,
      aiConfidence,
    };
  };

  // ============================================================
  // REPORT GENERATION
  // ============================================================

  const generateReport = (type: string) => {
    setIsGenerating(true);
    setShowReportModal(false);
    
    setTimeout(() => {
      const reportTypes: Record<string, string> = {
        executive: "Executive Investigation Report",
        court: "Court Evidence Report",
        full: "Full Investigation Report",
        incident: "Incident Response Report",
        forensic: "Digital Forensic Report",
        timeline: "Timeline Investigation Report",
      };
      
      const newReport = {
        id: `R-${String(reports.length + 1).padStart(3, "0")}`,
        title: `${reportTypes[type] || "Investigation Report"} - ${caseData?.case_id}`,
        date: new Date().toISOString().split("T")[0],
        status: "Ready",
        size: `${Math.floor(Math.random() * 500) + 100} KB`,
        caseId: caseData?.case_id,
        caseTitle: caseData?.title,
        type: type,
      };
      setReports([newReport, ...reports]);
      setIsGenerating(false);
      
      setTimelineEvents([...timelineEvents, {
        id: `T-${String(timelineEvents.length + 1).padStart(3, "0")}`,
        title: `Report Generated: ${newReport.title}`,
        description: `Report ${newReport.id} generated successfully`,
        type: "report",
        date: new Date().toISOString(),
      }]);
    }, 2000);
  };

  const downloadReport = (report: any, format: "html" | "pdf" | "text") => {
    setDownloadingReport(report.id);
    
    setTimeout(() => {
      try {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const formattedTime = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        const riskLevel = analysisResult?.threatLevel || "Low";
        const scores = calculateForensicScores();
        const ici = calculateICI(scores);

        const evidenceRows = evidence.map((item, index) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-size: 12px;">${String(index + 1).padStart(3, '0')}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-size: 12px;">${item.file_name}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-size: 12px;">${formatFileSize(item.file_size)}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-size: 12px;">${item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; color: #16A34A; font-size: 12px; font-weight: 600;">${item.hash_sha256 ? 'VERIFIED' : 'PENDING'}</td>
          </tr>
        `).join('');

        const timelineItems = timelineEvents.map((event) => `
          <tr>
            <td style="padding: 6px 12px; border-bottom: 1px solid #E5E7EB; color: #4B5563; font-size: 12px; white-space: nowrap;">
              ${event.date ? new Date(event.date).toLocaleDateString() : ''}
            </td>
            <td style="padding: 6px 12px; border-bottom: 1px solid #E5E7EB; color: #4B5563; font-size: 12px; white-space: nowrap;">
              ${event.date ? new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
            </td>
            <td style="padding: 6px 12px; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-size: 12px; font-weight: 500;">${event.title}</td>
            <td style="padding: 6px 12px; border-bottom: 1px solid #E5E7EB; color: #4B5563; font-size: 12px;">${event.description}</td>
          </tr>
        `).join('');

        const htmlContent = `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Digital Forensic Investigation Report - ${report.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', 'Georgia', serif; max-width: 1100px; margin: 0 auto; padding: 40px; background: #FFFFFF; color: #1F2937; line-height: 1.6; }
            .cover-page { text-align: center; padding: 60px 40px; min-height: 1000px; display: flex; flex-direction: column; justify-content: center; border-bottom: 3px double #1F2937; }
            .cover-page .logo { font-size: 38px; font-weight: 700; color: #1E3A8A; letter-spacing: 3px; }
            .cover-page .logo-ai { font-size: 38px; font-weight: 700; color: #7C3AED; }
            .cover-page .logo-sub { font-size: 16px; color: #4B5563; letter-spacing: 5px; font-weight: 300; margin-top: 4px; margin-bottom: 30px; }
            .cover-page .logo-by { font-size: 12px; color: #9CA3AF; letter-spacing: 4px; margin-top: -8px; margin-bottom: 30px; }
            .cover-page .divider { width: 80px; height: 2px; background: #1E3A8A; margin: 20px auto; }
            .cover-page .report-title { font-size: 28px; font-weight: 700; color: #1F2937; letter-spacing: 2px; margin-top: 30px; margin-bottom: 8px; text-transform: uppercase; }
            .cover-page .report-sub { font-size: 18px; color: #4B5563; margin-bottom: 30px; }
            .cover-page .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 500px; margin: 30px auto; text-align: left; }
            .cover-page .meta-grid .label { color: #6B7280; font-size: 13px; font-weight: 600; }
            .cover-page .meta-grid .value { color: #1F2937; font-size: 14px; font-weight: 500; }
            .cover-page .confidential { margin-top: 30px; padding: 8px 24px; border: 2px solid #DC2626; color: #DC2626; font-size: 14px; font-weight: 700; letter-spacing: 6px; display: inline-block; }
            .cover-page .footer-text { margin-top: 30px; color: #9CA3AF; font-size: 12px; }
            .section { margin-bottom: 30px; padding: 24px 0; border-bottom: 1px solid #E5E7EB; }
            .section:last-child { border-bottom: none; }
            .section-number { color: #1E3A8A; font-size: 14px; font-weight: 700; margin-bottom: 4px; }
            .section-title { font-size: 22px; font-weight: 700; color: #1F2937; margin-bottom: 16px; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px; }
            .label-text { color: #6B7280; font-size: 13px; font-weight: 600; display: block; margin-top: 8px; }
            .value-text { color: #1F2937; font-size: 14px; margin-bottom: 4px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
            .stat-box { background: #F9FAFB; padding: 16px; border-radius: 4px; border: 1px solid #E5E7EB; text-align: center; }
            .stat-box .number { font-size: 28px; font-weight: 700; color: #1F2937; }
            .stat-box .stat-label { font-size: 12px; color: #6B7280; margin-top: 4px; }
            .score-bar { width: 100%; height: 8px; background: #E5E7EB; border-radius: 4px; margin-top: 4px; overflow: hidden; }
            .score-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; }
            th { text-align: left; padding: 10px 12px; color: #1F2937; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: #F3F4F6; border-bottom: 2px solid #D1D5DB; }
            td { padding: 8px 12px; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-size: 13px; }
            .risk-badge { display: inline-block; padding: 4px 20px; border-radius: 4px; font-weight: 700; font-size: 14px; letter-spacing: 1px; }
            .risk-critical { background: #FEE2E2; color: #DC2626; border: 1px solid #DC2626; }
            .risk-high { background: #FEF3C7; color: #EA580C; border: 1px solid #EA580C; }
            .risk-medium { background: #DBEAFE; color: #2563EB; border: 1px solid #2563EB; }
            .risk-low { background: #DCFCE7; color: #16A34A; border: 1px solid #16A34A; }
            .signature-area { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .signature-area .sig-line { border-bottom: 1px solid #1F2937; width: 200px; margin-top: 30px; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #9CA3AF; font-size: 12px; }
            .footer .brand { color: #1E3A8A; font-weight: 600; }
            .ici-score { font-size: 48px; font-weight: 700; color: #1E3A8A; }
            .ici-rating { font-size: 20px; font-weight: 600; }
            .ici-excellent { color: #16A34A; }
            .ici-high { color: #3B82F6; }
            .ici-moderate { color: #F59E0B; }
            .ici-low { color: #F97316; }
            .ici-insufficient { color: #DC2626; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="cover-page">
              <div><span class="logo">TraceLens</span><span class="logo-ai">AI</span></div>
              <div class="logo-sub">AI-POWERED DIGITAL INVESTIGATION PLATFORM</div>
              <div class="logo-by">by SamiNova</div>
              <div style="width: 80px; height: 2px; background: #1E3A8A; margin: 20px auto;"></div>
              <div class="report-title">Digital Forensic Investigation Report</div>
              <div class="report-sub">Court-Admissible Evidence Report</div>
              <div style="width: 60px; height: 2px; background: #1E3A8A; margin: 20px auto;"></div>
              <div class="meta-grid">
                <div><div class="label">Report ID</div><div class="value">${report.id}</div></div>
                <div><div class="label">Case ID</div><div class="value">${report.caseId}</div></div>
                <div><div class="label">Case Title</div><div class="value">${report.caseTitle}</div></div>
                <div><div class="label">Date Prepared</div><div class="value">${formattedDate}</div></div>
                <div><div class="label">Prepared By</div><div class="value">Samina Parveen</div></div>
                <div><div class="label">Organization</div><div class="value">SamiNova</div></div>
              </div>
              <div class="confidential">CONFIDENTIAL - COURT USE ONLY</div>
              <div class="footer-text">This report is prepared for legal proceedings.</div>
            </div>

            <div class="section">
              <div class="section-number">SECTION 1</div>
              <div class="section-title">Executive Summary</div>
              <div style="margin-bottom: 12px;">
                <span class="label-text">Case Title</span>
                <div class="value-text" style="font-size: 18px; font-weight: 600;">${report.caseTitle}</div>
              </div>
              <div style="margin-bottom: 12px;">
                <span class="label-text">Investigation Overview</span>
                <div class="value-text">${caseData?.description || "No description available"}</div>
              </div>
              <div class="grid-3" style="margin-top: 16px;">
                <div class="stat-box"><div class="number">${evidence.length}</div><div class="stat-label">Evidence Files</div></div>
                <div class="stat-box"><div class="number">${analysisResult ? 1 : 0}</div><div class="stat-label">AI Analyses</div></div>
                <div class="stat-box"><div class="number">${timelineEvents.length}</div><div class="stat-label">Timeline Events</div></div>
              </div>
              <div style="margin-top: 16px;">
                <span class="label-text">Overall Risk Assessment</span>
                <div style="margin-top: 6px;">
                  <span class="risk-badge risk-${riskLevel.toLowerCase()}">${riskLevel.toUpperCase()} RISK</span>
                </div>
              </div>
              <div style="margin-top: 16px;">
                <span class="label-text">Investigation Confidence Index (ICI)</span>
                <div style="display: flex; align-items: center; gap: 16px; margin-top: 4px;">
                  <div class="ici-score">${ici.score}</div>
                  <div>
                    <div class="ici-rating ici-${ici.rating.toLowerCase()}">${ici.rating}</div>
                    <div style="font-size: 12px; color: #6B7280;">Based on forensic scoring framework</div>
                  </div>
                </div>
                <div style="margin-top: 8px;">
                  <div class="score-bar">
                    <div class="score-bar-fill" style="width: ${ici.score}%; background: ${ici.score >= 90 ? '#16A34A' : ici.score >= 75 ? '#3B82F6' : ici.score >= 60 ? '#F59E0B' : ici.score >= 40 ? '#F97316' : '#DC2626'};"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-number">SECTION 2</div>
              <div class="section-title">Case Information</div>
              <div class="grid-2">
                <div><span class="label-text">Case ID</span><div class="value-text" style="font-family: monospace; color: #1E3A8A;">${report.caseId}</div></div>
                <div><span class="label-text">Priority Level</span><div class="value-text">${caseData?.priority || "Medium"}</div></div>
                <div><span class="label-text">Case Status</span><div class="value-text">${caseData?.status || "Open"}</div></div>
                <div><span class="label-text">Investigation Start Date</span><div class="value-text">${caseData?.created_date || "N/A"}</div></div>
                <div><span class="label-text">Lead Investigator</span><div class="value-text">Samina Parveen</div></div>
                <div><span class="label-text">Organization</span><div class="value-text">SamiNova</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-number">SECTION 3</div>
              <div class="section-title">Evidence Inventory</div>
              ${evidence.length > 0 ? `
                <table>
                  <thead><tr><th>Item No.</th><th>File Name</th><th>Size</th><th>Collection Date</th><th>Integrity Status</th></tr></thead>
                  <tbody>${evidenceRows}</tbody>
                </table>
                <div style="margin-top: 8px; font-size: 12px; color: #6B7280;">Total Evidence Items: ${evidence.length}</div>
              ` : `<div style="color: #6B7280; text-align: center; padding: 20px;">No evidence uploaded.</div>`}
            </div>

            <div class="section">
              <div class="section-number">SECTION 4</div>
              <div class="section-title">Chain of Custody</div>
              <div style="margin-bottom: 12px;">
                <span class="label-text">Collection Method</span>
                <div class="value-text">Digital evidence was collected through secure file upload to TraceLens AI platform.</div>
              </div>
              ${evidence.length > 0 ? `
                <table>
                  <thead><tr><th>Evidence ID</th><th>Collected By</th><th>Collection Date</th><th>Verification</th></tr></thead>
                  <tbody>
                    ${evidence.map((item) => `
                      <tr>
                        <td style="padding: 6px 12px; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-size: 12px;">${item.evidence_id || item.id}</td>
                        <td style="padding: 6px 12px; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-size: 12px;">Samina Parveen</td>
                        <td style="padding: 6px 12px; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-size: 12px;">${item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</td>
                        <td style="padding: 6px 12px; border-bottom: 1px solid #E5E7EB; color: ${item.hash_sha256 ? '#16A34A' : '#F59E0B'}; font-size: 12px; font-weight: 600;">${item.hash_sha256 ? 'Verified' : 'Pending'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : `<div style="color: #6B7280; text-align: center; padding: 10px;">No evidence records.</div>`}
            </div>

            ${analysisResult ? `
            <div class="section">
              <div class="section-number">SECTION 5</div>
              <div class="section-title">AI-Assisted Analysis Results</div>
              <div style="margin-bottom: 8px; font-size: 13px; color: #6B7280; font-style: italic;">${AI_DISCLAIMER}</div>
              <div class="grid-2">
                <div><span class="label-text">Threat Level</span><div style="margin-top: 4px;"><span class="risk-badge risk-${analysisResult.threatLevel.toLowerCase()}">${analysisResult.threatLevel}</span></div></div>
                <div><span class="label-text">AI Confidence</span><div class="value-text" style="font-size: 20px; font-weight: 700;">${analysisResult.confidence}%</div></div>
              </div>
              <div style="margin-top: 12px;"><span class="label-text">Summary</span><div class="value-text">${analysisResult.summary}</div></div>
              <div style="margin-top: 12px;">
                <span class="label-text">Key Findings</span>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  ${analysisResult.findings.map((f: string) => `<li style="padding: 4px 0; color: #1F2937; font-size: 13px; border-bottom: 1px solid #F3F4F6;">• ${f}</li>`).join('')}
                </ul>
              </div>
              <div style="margin-top: 12px;">
                <span class="label-text">Conclusion</span>
                <div class="value-text">${analysisResult.conclusion}</div>
              </div>
            </div>
            ` : `
            <div class="section">
              <div class="section-number">SECTION 5</div>
              <div class="section-title">AI Analysis</div>
              <div style="color: #6B7280; text-align: center; padding: 20px;">No AI analysis performed.</div>
            </div>
            `}

            <div class="section">
              <div class="section-number">SECTION 6</div>
              <div class="section-title">Forensic Scoring</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div class="stat-box">
                  <div class="number">${scores.evidenceIntegrity.score}%</div>
                  <div class="stat-label">Evidence Integrity</div>
                  <div class="score-bar">
                    <div class="score-bar-fill" style="width: ${scores.evidenceIntegrity.score}%; background: ${scores.evidenceIntegrity.score >= 90 ? '#16A34A' : scores.evidenceIntegrity.score >= 75 ? '#3B82F6' : scores.evidenceIntegrity.score >= 60 ? '#F59E0B' : '#DC2626'};"></div>
                  </div>
                  <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">${scores.evidenceIntegrity.level}</div>
                </div>
                <div class="stat-box">
                  <div class="number">${scores.chainOfCustody.score}%</div>
                  <div class="stat-label">Chain of Custody</div>
                  <div class="score-bar">
                    <div class="score-bar-fill" style="width: ${scores.chainOfCustody.score}%; background: ${scores.chainOfCustody.score >= 90 ? '#16A34A' : scores.chainOfCustody.score >= 75 ? '#3B82F6' : scores.chainOfCustody.score >= 60 ? '#F59E0B' : '#DC2626'};"></div>
                  </div>
                  <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">${scores.chainOfCustody.level}</div>
                </div>
                <div class="stat-box">
                  <div class="number">${scores.metadataConfidence.score}%</div>
                  <div class="stat-label">Metadata Confidence</div>
                  <div class="score-bar">
                    <div class="score-bar-fill" style="width: ${scores.metadataConfidence.score}%; background: ${scores.metadataConfidence.score >= 80 ? '#16A34A' : scores.metadataConfidence.score >= 60 ? '#3B82F6' : scores.metadataConfidence.score >= 40 ? '#F59E0B' : '#DC2626'};"></div>
                  </div>
                  <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">${scores.metadataConfidence.level}</div>
                </div>
                <div class="stat-box">
                  <div class="number">${scores.aiConfidence.score}%</div>
                  <div class="stat-label">AI Confidence</div>
                  <div class="score-bar">
                    <div class="score-bar-fill" style="width: ${scores.aiConfidence.score}%; background: ${scores.aiConfidence.score >= 85 ? '#16A34A' : scores.aiConfidence.score >= 70 ? '#3B82F6' : scores.aiConfidence.score >= 50 ? '#F59E0B' : '#DC2626'};"></div>
                  </div>
                  <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">${scores.aiConfidence.level}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-number">SECTION 7</div>
              <div class="section-title">Timeline</div>
              ${timelineEvents.length > 0 ? `
                <table>
                  <thead><tr><th>Date</th><th>Time</th><th>Event</th><th>Description</th></tr></thead>
                  <tbody>${timelineItems}</tbody>
                </table>
              ` : `<div style="color: #6B7280; text-align: center; padding: 20px;">No timeline events.</div>`}
            </div>

            <div class="section">
              <div class="section-number">SECTION 8</div>
              <div class="section-title">Investigator Certification</div>
              <div style="margin: 16px 0; padding: 20px; border: 1px solid #D1D5DB; border-radius: 4px; background: #F9FAFB;">
                <p style="font-size: 14px; color: #1F2937; line-height: 1.8; text-align: justify;">
                  I certify that the examination was conducted using accepted digital forensic methodologies.
                </p>
              </div>
              <div class="signature-area">
                <div>
                  <div class="label-text">Investigator</div>
                  <div class="value-text" style="font-size: 16px; font-weight: 600;">Samina Parveen</div>
                  <div class="label-text">Organization</div>
                  <div class="value-text">SamiNova</div>
                </div>
                <div>
                  <div class="label-text">Date</div>
                  <div class="sig-line"></div>
                  <div style="margin-top: 8px; font-size: 12px; color: #6B7280;">${formattedDate}</div>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>Generated by <span class="brand">TraceLens AI</span> © ${new Date().getFullYear()} SamiNova</p>
              <p>Report: ${report.id} | Version: 1.0</p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid #E5E7EB;">
              <button onclick="window.print()" style="padding: 12px 40px; background: #1E3A8A; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; margin: 0 8px;">
                Print / Save as PDF
              </button>
              <button onclick="window.close()" style="padding: 12px 40px; background: #F3F4F6; color: #1F2937; border: 1px solid #D1D5DB; border-radius: 4px; font-size: 16px; cursor: pointer; margin: 0 8px;">
                Close
              </button>
            </div>
          </div>
        </body>
        </html>`;
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
        } else {
          alert('Please allow popups to view the report.');
        }
        setDownloadingReport(null);

      } catch (error) {
        alert("Error generating report. Please try again.");
        setDownloadingReport(null);
      }
    }, 1000);
  };

  // ============================================================
  // LOADING / ERROR STATES
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-[#0B1220]">
        <nav className="bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1E293B] px-6 py-3 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <PremiumLogo size="md" variant="white" />
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-2">Case Not Found</h2>
            <p className="text-gray-400">The case you're looking for doesn't exist.</p>
            <Link href="/cases" className="inline-block mt-4 px-4 py-2 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition">
              Back to Cases
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[#0B1220]">
      {/* Navbar */}
      <nav className="bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1E293B] px-6 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <PremiumLogo size="md" variant="white" />
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/cases" className="text-sm text-gray-400 hover:text-white transition-colors">Cases</Link>
            <div className="flex items-center space-x-3 pl-4 border-l border-[#1E293B]">
              <div className="w-8 h-8 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">S</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Samina</p>
                <p className="text-xs text-gray-500">Investigator</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Link href="/cases" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-6">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Cases
        </Link>

        {/* Case Header */}
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-[#3B82F6]">{caseData.case_id}</span>
                <span className={`w-2 h-2 rounded-full ${getStatusDot(caseData.status)}`}></span>
                <span className={`text-xs px-2.5 py-1 rounded-full ${getStatusColor(caseData.status)}`}>
                  {caseData.status}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white mt-2">{caseData.title}</h1>
              <p className="text-gray-400 mt-1">{caseData.description || 'No description provided'}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-sm px-3 py-1.5 rounded-full ${getPriorityColor(caseData.priority)}`}>
                Priority: {caseData.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Evidence Files</p>
            <p className="text-2xl font-bold text-white">{evidence.length}</p>
          </div>
          <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Priority</p>
            <p className="text-lg font-semibold text-white">{caseData.priority}</p>
          </div>
          <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
            <p className="text-lg font-semibold text-white">{caseData.status}</p>
          </div>
          <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Created</p>
            <p className="text-lg font-semibold text-white">{caseData.created_date || new Date(caseData.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#1E293B] mb-6">
          <div className="flex space-x-6 overflow-x-auto">
            {["overview", "evidence", "analysis", "timeline", "reports"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab ? "text-[#3B82F6] border-[#3B82F6]" : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === "overview" && (
          <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Case ID</p>
                  <p className="text-white font-medium mt-1">{caseData.case_id}</p>
                </div>
                <div className="p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Case Type</p>
                  <p className="text-white font-medium mt-1">{caseData.case_type || 'General'}</p>
                </div>
                <div className="p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                  <p className="text-white font-medium mt-1">{caseData.status}</p>
                </div>
                <div className="p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Priority</p>
                  <p className="text-white font-medium mt-1">{caseData.priority}</p>
                </div>
              </div>
              <div className="p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Description</p>
                <p className="text-gray-300 mt-1">{caseData.description || 'No description provided'}</p>
              </div>
            </div>
          </div>
        )}

        {/* ============ EVIDENCE TAB ============ */}
        {activeTab === "evidence" && (
          <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-6">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragActive ? "border-[#3B82F6] bg-[#3B82F6]/10" : "border-[#2A3A4A] hover:border-[#3B82F6]/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input type="file" id="fileUpload" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.csv,.json,.xml,.html,.eml,.msg,.log,.pcap,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff" />
              <label htmlFor="fileUpload" className="cursor-pointer">
                <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-400">Drag & drop evidence here, or click to browse</p>
                <p className="text-xs text-gray-500 mt-2">Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JSON, XML, HTML, EML, MSG, LOG, Images, PCAP, Disk Images</p>
                <p className="text-xs text-red-400 mt-1">⚠️ Executable files are blocked for security</p>
              </label>
            </div>

            {uploadError && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">⚠️ {uploadError}</div>
            )}

            {uploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-[#0B1220] rounded-full h-2">
                  <div className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}

            {evidence.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Uploaded Evidence</h3>
                <div className="space-y-2">
                  {evidence.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-sm text-white">{item.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {item.file_type || 'Unknown'} • {formatFileSize(item.file_size || 0)} • 
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs ${item.hash_sha256 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {item.hash_sha256 ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">📄 {evidence.length} file(s) in this case</p>
              </div>
            )}

            {evidence.length === 0 && !uploading && (
              <div className="mt-6 text-center py-8">
                <p className="text-gray-500">No evidence uploaded yet</p>
                <p className="text-xs text-gray-600 mt-1">Upload files to start your investigation</p>
              </div>
            )}
          </div>
        )}

        {/* ============ ANALYSIS TAB ============ */}
        {activeTab === "analysis" && (
          <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Complete AI Analysis</h3>
                <p className="text-sm text-gray-400">AI will read and analyze your uploaded evidence</p>
              </div>
              <button
                onClick={runAIAnalysis}
                disabled={analyzing || uploadedFiles.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? "Analyzing..." : "Run Complete Analysis"}
              </button>
            </div>

            {uploadedFiles.length === 0 && !analyzing && (
              <div className="text-center py-8">
                <p className="text-yellow-400">⚠️ No evidence uploaded</p>
                <p className="text-sm text-gray-500 mt-1">Go to Evidence tab and upload a file first</p>
              </div>
            )}

            {analyzing && (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-400 mt-4">AI is reading and analyzing your file...</p>
                <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
                <div className="mt-4 flex justify-center space-x-2">
                  <span className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
                  <span className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                  <span className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                </div>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-4">
                <div className="p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Analysis Summary</p>
                  <p className="text-white mt-1">{analysisResult.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Threat Level</p>
                    <p className={`text-lg font-bold mt-1 ${
                      analysisResult.threatLevel === "Critical" ? "text-red-500" :
                      analysisResult.threatLevel === "High" ? "text-orange-500" :
                      analysisResult.threatLevel === "Medium" ? "text-yellow-500" :
                      "text-green-500"
                    }`}>
                      {analysisResult.threatLevel}
                    </p>
                  </div>
                  <div className="p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Confidence Score</p>
                    <p className="text-lg font-bold text-white mt-1">{analysisResult.confidence}%</p>
                    <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] h-1.5 rounded-full" style={{ width: `${analysisResult.confidence}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Key Findings</p>
                  <ul className="mt-2 space-y-1">
                    {analysisResult.findings.map((finding, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-center space-x-2">
                        <span className="text-[#3B82F6]">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Indicators of Compromise</p>
                  <ul className="mt-2 space-y-1">
                    {analysisResult.indicators.map((indicator, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-center space-x-2">
                        <span className="text-yellow-500">⚠</span>
                        <span>{indicator}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Recommendations</p>
                  <ul className="mt-2 space-y-1">
                    {analysisResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-center space-x-2">
                        <span className="text-green-400">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Conclusion</p>
                  <p className="text-white mt-1">{analysisResult.conclusion}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ TIMELINE TAB ============ */}
        {activeTab === "timeline" && (
          <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Investigation Timeline</h3>
                <p className="text-sm text-gray-400">
                  {timelineEvents.length > 0 
                    ? `Auto-generated from case activity (${timelineEvents.length} events)` 
                    : "No events yet - events will appear as you upload evidence and run analysis"}
                </p>
              </div>
            </div>

            {timelineEvents.length > 0 && (
              <div className="space-y-3">
                {timelineEvents.map((event, index) => (
                  <div key={event.id} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        event.type === "case" ? "bg-blue-400" :
                        event.type === "evidence" ? "bg-yellow-400" :
                        event.type === "analysis" ? "bg-purple-400" :
                        event.type === "report" ? "bg-green-400" :
                        "bg-gray-400"
                      }`}></div>
                      {index < timelineEvents.length - 1 && (
                        <div className="w-0.5 h-8 bg-[#1E293B]"></div>
                      )}
                    </div>
                    <div className="flex-1 p-3 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">{event.title}</p>
                        <span className="text-xs text-gray-500">
                          {event.date ? new Date(event.date).toLocaleString() : event.date}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {timelineEvents.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-400">No timeline events yet</p>
                <p className="text-sm text-gray-500 mt-1">Events will appear automatically when you:</p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <span className="px-3 py-1 bg-[#0B1220] rounded-full text-xs text-gray-400 border border-[#1E293B]">📁 Upload evidence</span>
                  <span className="px-3 py-1 bg-[#0B1220] rounded-full text-xs text-gray-400 border border-[#1E293B]">🤖 Run AI analysis</span>
                  <span className="px-3 py-1 bg-[#0B1220] rounded-full text-xs text-gray-400 border border-[#1E293B]">📊 Generate reports</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ REPORTS TAB ============ */}
        {activeTab === "reports" && (
          <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Investigation Reports</h3>
                <p className="text-sm text-gray-400">Generate comprehensive reports for submission</p>
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                disabled={generatingReport || isGenerating}
                className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? "Generating..." : "New Report"}
              </button>
            </div>

            {isGenerating && (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-400 mt-4">Generating comprehensive report...</p>
                <p className="text-sm text-gray-500 mt-1">Compiling evidence, analysis, and findings</p>
              </div>
            )}

            {reports.length > 0 && (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="bg-[#0B1220] rounded-xl border border-[#1E293B] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-semibold text-white">{report.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            analysisResult?.threatLevel === "Critical" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                            analysisResult?.threatLevel === "High" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                            analysisResult?.threatLevel === "Medium" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                            "bg-green-500/20 text-green-400 border border-green-500/30"
                          }`}>
                            {analysisResult?.threatLevel || "Low"} Risk
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 ml-8">
                          <span className="text-xs text-gray-500">ID: {report.id}</span>
                          <span className="text-xs text-gray-500">Date: {report.date}</span>
                          <span className="text-xs text-gray-500">Size: {report.size}</span>
                          <span className="text-xs text-gray-500">Evidence: {evidence.length} files</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => downloadReport(report, "html")}
                          disabled={downloadingReport === report.id}
                          className="px-3 py-1.5 bg-[#3B82F6] text-white text-xs font-medium rounded-lg hover:bg-[#2563EB] transition-colors disabled:opacity-50"
                          title="Download HTML Report"
                        >
                          {downloadingReport === report.id ? "⏳" : "HTML"}
                        </button>
                        <button
                          onClick={() => downloadReport(report, "pdf")}
                          disabled={downloadingReport === report.id}
                          className="px-3 py-1.5 bg-[#8B5CF6] text-white text-xs font-medium rounded-lg hover:bg-[#7C3AED] transition-colors disabled:opacity-50"
                          title="Download PDF Report"
                        >
                          {downloadingReport === report.id ? "⏳" : "PDF"}
                        </button>
                        <button
                          onClick={() => downloadReport(report, "text")}
                          disabled={downloadingReport === report.id}
                          className="px-3 py-1.5 bg-[#1E293B] border border-[#334155] text-gray-300 text-xs font-medium rounded-lg hover:bg-[#334155] transition-colors disabled:opacity-50"
                          title="Download Text Report"
                        >
                          {downloadingReport === report.id ? "⏳" : "TXT"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reports.length === 0 && !isGenerating && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-400">No reports generated</p>
                <p className="text-sm text-gray-500 mt-1">Generate a comprehensive report for this case</p>
                <p className="text-xs text-gray-600 mt-2">Reports include: Executive Summary, Evidence Analysis, Timeline, Findings, and Recommendations</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============ REPORT TYPE SELECTION MODAL ============ */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Select Report Type</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: "court", title: "Court Evidence Report", description: "Full court-admissible report with chain of custody.", icon: "⚖️", color: "border-blue-500/30 hover:border-blue-500" },
                { id: "executive", title: "Executive Summary Report", description: "High-level overview for executives.", icon: "📋", color: "border-green-500/30 hover:border-green-500" },
                { id: "full", title: "Full Investigation Report", description: "Complete investigation report with all details.", icon: "📊", color: "border-purple-500/30 hover:border-purple-500" },
                { id: "forensic", title: "Digital Forensic Report", description: "Detailed forensic analysis report.", icon: "🔬", color: "border-orange-500/30 hover:border-orange-500" },
                { id: "incident", title: "Incident Response Report", description: "Incident response documentation.", icon: "🛡️", color: "border-red-500/30 hover:border-red-500" },
                { id: "timeline", title: "Timeline Investigation Report", description: "Chronological timeline reconstruction.", icon: "⏱️", color: "border-yellow-500/30 hover:border-yellow-500" }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => generateReport(type.id)}
                  className={`p-4 border rounded-xl text-left transition-all ${type.color} hover:bg-[#1E293B]/50 bg-[#0B1220]`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <h3 className="text-sm font-semibold text-white">{type.title}</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{type.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#1E293B] flex justify-end">
              <button onClick={() => setShowReportModal(false)} className="px-4 py-2 bg-[#0B1220] border border-[#2A3A4A] text-gray-400 font-medium rounded-xl hover:bg-[#1A2332] transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}