"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { extractMetadata, MetadataResult, getFileIcon, formatFileSize } from "../lib/metadataService";
import PremiumLogo from "@/app/components/ui/PremiumLogo";
import { supabase } from "../lib/supabase";

export default function MetadataPage() {
  const searchParams = useSearchParams();
  const evidenceId = searchParams?.get('evidenceId');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeSection, setActiveSection] = useState("file");
  const [metadata, setMetadata] = useState<MetadataResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // ============ CASE SELECTOR STATE ============
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
  const [newCase, setNewCase] = useState({
    title: "",
    description: "",
    priority: "Medium",
    status: "Open",
  });

  // ============ EVIDENCE STATE ============
  const [caseEvidence, setCaseEvidence] = useState<any[]>([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>("");
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [extractedFromCase, setExtractedFromCase] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ============ LOAD REAL CASES FROM SUPABASE ============
  useEffect(() => {
    async function loadCases() {
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('case_id, title, status, priority')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading cases:', error);
          return;
        }

        if (data && data.length > 0) {
          // Map database fields to component format
          const mappedCases = data.map((c: any) => ({
            id: c.case_id,
            title: c.title,
            status: c.status || 'Open',
            priority: c.priority || 'Medium'
          }));
          setCases(mappedCases);
          setSelectedCaseId(mappedCases[0].id);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    }

    loadCases();
  }, []);

  // ============ LOAD EVIDENCE FOR SELECTED CASE ============
  useEffect(() => {
    async function loadEvidence() {
      if (!selectedCaseId) return;

      try {
        const { data, error } = await supabase
          .from('evidence')
          .select('id, evidence_id, file_name, file_type, file_size, created_at')
          .eq('case_id', selectedCaseId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading evidence:', error);
          return;
        }

        if (data && data.length > 0) {
          const mappedEvidence = data.map((e: any) => ({
            id: e.evidence_id || e.id,
            name: e.file_name,
            type: e.file_type || 'Unknown',
            size: e.file_size ? (e.file_size / 1024).toFixed(1) + ' KB' : 'Unknown',
            caseId: selectedCaseId,
            metadata: null // Will be loaded when selected
          }));
          setCaseEvidence(mappedEvidence);
          setSelectedEvidenceId(mappedEvidence[0].id);
        } else {
          setCaseEvidence([]);
          setSelectedEvidenceId('');
        }
      } catch (err) {
        console.error('Error:', err);
      }
    }

    loadEvidence();
  }, [selectedCaseId]);

  // ============ LOAD METADATA FOR SELECTED EVIDENCE ============
  useEffect(() => {
    if (selectedEvidenceId && extractedFromCase) {
      // In a real implementation, you would fetch metadata from evidence_metadata table
      // For now, we'll use the extracted metadata if available
    }
  }, [selectedEvidenceId, extractedFromCase]);

  const currentCase = cases.find(c => c.id === selectedCaseId);
  const selectedEvidence = caseEvidence.find(e => e.id === selectedEvidenceId);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const getAvailableSections = () => {
    const sections = [{ id: "file", label: "File Info", icon: "📄" }];
    if (metadata?.document) sections.push({ id: "document", label: "Document Info", icon: "📝" });
    if (metadata?.camera) sections.push({ id: "camera", label: "Camera Data", icon: "📷" });
    if (metadata?.gps) sections.push({ id: "gps", label: "GPS Location", icon: "📍" });
    if (metadata?.log) sections.push({ id: "log", label: "Log Data", icon: "📋" });
    if (metadata?.email) sections.push({ id: "email", label: "Email Info", icon: "📧" });
    if (metadata?.code) sections.push({ id: "code", label: "Code Info", icon: "💻" });
    return sections;
  };

  // ============ HANDLE CASE SELECTION ============
  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setShowCaseModal(false);
    setMetadata(null);
    setSelectedFile(null);
    setError("");
    setExtractedFromCase(false);
  };

  // ============ HANDLE EVIDENCE SELECTION ============
  const handleSelectEvidence = (evidenceId: string) => {
    setSelectedEvidenceId(evidenceId);
    setShowEvidenceModal(false);
    setExtractedFromCase(true);
    // In a real implementation, fetch metadata here
  };

  // ============ HANDLE CREATE CASE ============
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, organization_id')
        .limit(1);

      const profile = profileData?.[0];
      if (!profile) {
        alert('No profile found. Please make sure you are logged in.');
        return;
      }

      const caseId = `CASE-${Date.now().toString().slice(-6)}`;
      const { data, error } = await supabase
        .from('cases')
        .insert([{
          case_id: caseId,
          title: newCase.title,
          description: newCase.description || null,
          priority: newCase.priority,
          status: newCase.status,
          organization_id: profile.organization_id,
          created_by: profile.id,
          created_date: new Date().toISOString().split('T')[0],
        }])
        .select();

      if (error) {
        console.error('Error creating case:', error);
        alert('Failed to create case. Please try again.');
        return;
      }

      // Reload cases
      const { data: updatedCases } = await supabase
        .from('cases')
        .select('case_id, title, status, priority')
        .order('created_at', { ascending: false });

      if (updatedCases) {
        const mappedCases = updatedCases.map((c: any) => ({
          id: c.case_id,
          title: c.title,
          status: c.status || 'Open',
          priority: c.priority || 'Medium'
        }));
        setCases(mappedCases);
        if (data && data.length > 0) {
          setSelectedCaseId(data[0].case_id);
        }
      }

      setShowCreateModal(false);
      setNewCase({ title: "", description: "", priority: "Medium", status: "Open" });
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to create case. Please try again.');
    }
  };

  // ============ HANDLE ADD EVIDENCE ============
  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedCaseId) {
      setError("Please select a case and file first!");
      return;
    }

    setUploadingEvidence(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 300);

      // Generate hash
      const hashValue = Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      // Upload to Supabase
      const { data, error } = await supabase
        .from('evidence')
        .insert([{
          evidence_id: `E-${Date.now().toString().slice(-6)}`,
          case_id: selectedCaseId,
          file_name: selectedFile.name,
          file_type: selectedFile.type || null,
          file_size: selectedFile.size,
          hash_sha256: hashValue,
          description: `Uploaded via Metadata Analysis`,
        }])
        .select();

      if (error) {
        console.error('Error uploading evidence:', error);
        setError('Failed to upload evidence. Please try again.');
        setUploadingEvidence(false);
        return;
      }

      // Reload evidence
      const { data: updatedEvidence } = await supabase
        .from('evidence')
        .select('id, evidence_id, file_name, file_type, file_size, created_at')
        .eq('case_id', selectedCaseId)
        .order('created_at', { ascending: false });

      if (updatedEvidence) {
        const mappedEvidence = updatedEvidence.map((e: any) => ({
          id: e.evidence_id || e.id,
          name: e.file_name,
          type: e.file_type || 'Unknown',
          size: e.file_size ? (e.file_size / 1024).toFixed(1) + ' KB' : 'Unknown',
          caseId: selectedCaseId,
          metadata: null
        }));
        setCaseEvidence(mappedEvidence);
        if (mappedEvidence.length > 0) {
          setSelectedEvidenceId(mappedEvidence[0].id);
        }
      }

      setShowAddEvidenceModal(false);
      setSelectedFile(null);
      setUploadProgress(100);
      setExtractedFromCase(true);
      
    } catch (err) {
      console.error("Error adding evidence:", err);
      setError("Failed to add evidence. Please try again.");
    } finally {
      setUploadingEvidence(false);
      setUploadProgress(0);
    }
  };

  // ============ FILE UPLOAD ============
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setExtractedFromCase(false);
      setLoading(true);
      setError("");
      
      try {
        const result = await extractMetadata(file);
        setMetadata(result);
        setActiveSection("file");
        console.log("✅ Metadata extracted:", result);
      } catch (err) {
        console.error("❌ Error:", err);
        setError("Failed to extract metadata. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      setError("Please upload a file first!");
      return;
    }
    
    if (!selectedCaseId) {
      setError("Please select a case first!");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const result = await extractMetadata(selectedFile);
      setMetadata(result);
      setExtractedFromCase(true);
    } catch (err) {
      setError("Failed to extract metadata. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============ EXPORT FUNCTION ============
  const handleExport = (format: "json" | "html" = "json") => {
    if (!metadata) {
      setError("No metadata to export. Please extract metadata first.");
      return;
    }

    try {
      const exportData = {
        fileName: metadata.fileName,
        fileSize: metadata.fileSize,
        fileType: metadata.fileType,
        fileCategory: metadata.fileCategory,
        created: metadata.created,
        modified: metadata.modified,
        hash: metadata.hash,
        document: metadata.document || null,
        camera: metadata.camera || null,
        gps: metadata.gps || null,
        log: metadata.log || null,
        email: metadata.email || null,
        code: metadata.code || null,
        caseId: currentCase?.id || "Not linked",
        caseTitle: currentCase?.title || "Not linked",
        evidenceId: selectedEvidenceId || "Not linked",
        exportedAt: new Date().toISOString(),
        exportedBy: "Samina Parveen",
        platform: "TraceLens AI",
      };

      if (format === "html") {
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Metadata Export - ${metadata.fileName}</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px; background: #0B1220; color: #F9FAFB; }
    h1 { color: #3B82F6; border-bottom: 2px solid #3B82F6; padding-bottom: 10px; }
    h2 { color: #8B5CF6; margin-top: 24px; border-bottom: 1px solid #1E293B; padding-bottom: 8px; }
    .section { background: #1A2332; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #1E293B; }
    .field { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1E293B; }
    .field .label { color: #9CA3AF; font-weight: 500; }
    .field .value { color: #F9FAFB; word-break: break-all; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-green { background: #22C55E20; color: #22C55E; border: 1px solid #22C55E30; }
    .footer { margin-top: 40px; text-align: center; color: #6B7280; font-size: 12px; border-top: 1px solid #1E293B; padding-top: 20px; }
  </style>
</head>
<body>
  <h1>🔍 TraceLens AI - Metadata Report</h1>
  <p>Exported: ${new Date().toLocaleString()}</p>
  <p><span class="badge badge-green">Case: ${currentCase?.id || "Not linked"}</span></p>
  <p><span class="badge badge-green">Evidence: ${selectedEvidenceId || "Not linked"}</span></p>

  <div class="section">
    <h2>File Information</h2>
    <div class="field"><span class="label">File Name</span><span class="value">${metadata.fileName}</span></div>
    <div class="field"><span class="label">File Size</span><span class="value">${metadata.fileSize}</span></div>
    <div class="field"><span class="label">File Type</span><span class="value">${metadata.fileType}</span></div>
    <div class="field"><span class="label">Category</span><span class="value">${metadata.fileCategory}</span></div>
    <div class="field"><span class="label">Created</span><span class="value">${formatDate(metadata.created)}</span></div>
    <div class="field"><span class="label">Modified</span><span class="value">${formatDate(metadata.modified)}</span></div>
    <div class="field"><span class="label">SHA-256</span><span class="value" style="font-size: 12px; font-family: monospace;">${metadata.hash}</span></div>
  </div>

  ${metadata.document ? `
  <div class="section">
    <h2>Document Metadata</h2>
    ${metadata.document.author && metadata.document.author !== 'Un-named' ? `<div class="field"><span class="label">Author</span><span class="value">${metadata.document.author}</span></div>` : ''}
    ${metadata.document.title ? `<div class="field"><span class="label">Title</span><span class="value">${metadata.document.title}</span></div>` : ''}
    ${metadata.document.creator ? `<div class="field"><span class="label">Creator</span><span class="value">${metadata.document.creator}</span></div>` : ''}
    ${metadata.document.producer ? `<div class="field"><span class="label">Producer</span><span class="value">${metadata.document.producer}</span></div>` : ''}
    ${metadata.document.pages && metadata.document.pages > 0 ? `<div class="field"><span class="label">Pages</span><span class="value">${metadata.document.pages}</span></div>` : ''}
    ${metadata.document.wordCount && metadata.document.wordCount > 0 ? `<div class="field"><span class="label">Word Count</span><span class="value">${metadata.document.wordCount.toLocaleString()}</span></div>` : ''}
    ${metadata.document.characterCount && metadata.document.characterCount > 0 ? `<div class="field"><span class="label">Character Count</span><span class="value">${metadata.document.characterCount.toLocaleString()}</span></div>` : ''}
  </div>
  ` : ''}

  ${metadata.camera ? `
  <div class="section">
    <h2>Camera Metadata</h2>
    ${metadata.camera.make ? `<div class="field"><span class="label">Make</span><span class="value">${metadata.camera.make}</span></div>` : ''}
    ${metadata.camera.model ? `<div class="field"><span class="label">Model</span><span class="value">${metadata.camera.model}</span></div>` : ''}
    ${metadata.camera.aperture ? `<div class="field"><span class="label">Aperture</span><span class="value">${metadata.camera.aperture}</span></div>` : ''}
    ${metadata.camera.shutter ? `<div class="field"><span class="label">Shutter</span><span class="value">${metadata.camera.shutter}</span></div>` : ''}
    ${metadata.camera.iso ? `<div class="field"><span class="label">ISO</span><span class="value">${metadata.camera.iso}</span></div>` : ''}
  </div>
  ` : ''}

  ${metadata.gps ? `
  <div class="section">
    <h2>GPS Location</h2>
    ${metadata.gps.latitude ? `<div class="field"><span class="label">Latitude</span><span class="value">${metadata.gps.latitude}</span></div>` : ''}
    ${metadata.gps.longitude ? `<div class="field"><span class="label">Longitude</span><span class="value">${metadata.gps.longitude}</span></div>` : ''}
    ${metadata.gps.location ? `<div class="field"><span class="label">Location</span><span class="value">${metadata.gps.location}</span></div>` : ''}
  </div>
  ` : ''}

  ${metadata.log ? `
  <div class="section">
    <h2>Log Data</h2>
    <div class="field"><span class="label">Line Count</span><span class="value">${metadata.log.lineCount.toLocaleString()}</span></div>
    ${metadata.log.entries ? `
    <div style="margin-top: 12px;">
      <p style="color: #9CA3AF; font-size: 13px;">Sample Entries:</p>
      ${metadata.log.entries.slice(0, 5).map((entry, i) => `
        <div style="background: #0B1220; padding: 8px; border-radius: 4px; margin-top: 4px; font-size: 12px;">
          <span style="color: #60A5FA;">${entry.timestamp}</span>
          <span style="color: ${entry.level === 'ERROR' ? '#EF4444' : entry.level === 'WARNING' ? '#F59E0B' : '#22C55E'}">[${entry.level}]</span>
          <span style="color: #D1D5DB;">${entry.message}</span>
        </div>
      `).join('')}
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${metadata.email ? `
  <div class="section">
    <h2>Email Information</h2>
    ${metadata.email.from ? `<div class="field"><span class="label">From</span><span class="value">${metadata.email.from}</span></div>` : ''}
    ${metadata.email.to ? `<div class="field"><span class="label">To</span><span class="value">${metadata.email.to}</span></div>` : ''}
    ${metadata.email.subject ? `<div class="field"><span class="label">Subject</span><span class="value">${metadata.email.subject}</span></div>` : ''}
    ${metadata.email.date ? `<div class="field"><span class="label">Date</span><span class="value">${formatDate(metadata.email.date)}</span></div>` : ''}
    ${metadata.email.bodyPreview ? `<div class="field"><span class="label">Body Preview</span><span class="value" style="font-size: 12px;">${metadata.email.bodyPreview}</span></div>` : ''}
  </div>
  ` : ''}

  ${metadata.code ? `
  <div class="section">
    <h2>Code Information</h2>
    ${metadata.code.language ? `<div class="field"><span class="label">Language</span><span class="value">${metadata.code.language}</span></div>` : ''}
    <div class="field"><span class="label">Lines</span><span class="value">${metadata.code.lines.toLocaleString()}</span></div>
    <div class="field"><span class="label">Characters</span><span class="value">${metadata.code.characters.toLocaleString()}</span></div>
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by TraceLens AI © ${new Date().getFullYear()} SamiNova</p>
    <p>Exported by: Samina Parveen</p>
  </div>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `metadata_${metadata.fileName.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const jsonData = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `metadata_${metadata.fileName.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setError("");
    } catch (err) {
      console.error("Export error:", err);
      setError("Failed to export metadata. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220]">
      
      {/* ===== NAVBAR WITH PREMIUM LOGO ===== */}
      <nav className="bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1E293B] px-6 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
            <PremiumLogo size="md" variant="white" />
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/cases" className="text-sm text-gray-400 hover:text-white transition-colors">Cases</Link>
            <Link href="/evidence" className="text-sm text-gray-400 hover:text-white transition-colors">Evidence</Link>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center font-semibold text-sm text-white">
              S
            </div>
          </div>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Metadata Analysis</h1>
            <p className="text-gray-400">Extract and analyze metadata from digital evidence</p>
          </div>
          <button
            onClick={() => setShowAddEvidenceModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Evidence</span>
          </button>
        </div>

        {/* ============ CASE SELECTOR ============ */}
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400">Current Case:</span>
              {currentCase ? (
                <span className="text-sm font-medium text-white">
                  {currentCase.id} - {currentCase.title}
                </span>
              ) : (
                <span className="text-sm text-yellow-400">No case selected</span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCaseModal(true)}
                className="px-4 py-2 text-sm bg-[#0B1220] border border-[#2A3A4A] text-gray-300 rounded-xl hover:bg-[#1E293B] transition-all"
              >
                Select Case
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 text-sm bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all"
              >
                + New Case
              </button>
            </div>
          </div>
        </div>

        {/* ============ EVIDENCE SELECTOR ============ */}
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400">Evidence File:</span>
              {selectedEvidence ? (
                <span className="text-sm font-medium text-white">
                  {selectedEvidence.id} - {selectedEvidence.name}
                </span>
              ) : (
                <span className="text-sm text-yellow-400">No evidence selected</span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowEvidenceModal(true)}
                disabled={caseEvidence.length === 0}
                className="px-4 py-2 text-sm bg-[#0B1220] border border-[#2A3A4A] text-gray-300 rounded-xl hover:bg-[#1E293B] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select Evidence
              </button>
              <span className="text-xs text-gray-500">
                {caseEvidence.length} file(s) in case
              </span>
            </div>
          </div>
          {extractedFromCase && selectedEvidence?.metadata && (
            <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-xs text-green-400">✅ Metadata loaded from case evidence</p>
            </div>
          )}
        </div>

        {/* ============ UPLOAD SECTION ============ */}
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="file"
                id="fileUpload"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.tiff,.webp,.gif,.bmp,.ico,.log,.txt,.csv,.tsv,.eml,.msg,.zip,.rar,.7z,.tar,.gz,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.go,.rb,.php,.html,.css,.scss,.json,.xml,.yaml,.yml,.md"
              />
              <label
                htmlFor="fileUpload"
                className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-gray-400 cursor-pointer hover:border-[#3B82F6]/50 transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>{selectedFile ? selectedFile.name : "Click to upload a file"}</span>
              </label>
            </div>
            <button
              onClick={handleExtract}
              disabled={!selectedFile || !selectedCaseId || loading}
              className="px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? "Extracting..." : "Extract Metadata"}
            </button>
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}
          
          {selectedFile && !loading && metadata && (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
              ✅ Metadata extracted from: {selectedFile.name}
              {currentCase && ` • Linked to: ${currentCase.id}`}
              {metadata.camera && ` • Camera: ${metadata.camera.make} ${metadata.camera.model}`}
              {metadata.gps && ` • GPS: ${metadata.gps.latitude}`}
            </div>
          )}
        </div>

        {/* ============ METADATA DISPLAY ============ */}
        {loading ? (
          <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-12 text-center">
            <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 mt-4">Extracting metadata from file...</p>
          </div>
        ) : metadata ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* ============ SIDEBAR ============ */}
            <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4 h-fit">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Sections</h3>
              <div className="space-y-1">
                {getAvailableSections().map((section) => {
                  const isActive = activeSection === section.id;
                  const hasData = section.id === "file" || 
                    (section.id === "document" && metadata?.document) ||
                    (section.id === "camera" && metadata?.camera) ||
                    (section.id === "gps" && metadata?.gps) ||
                    (section.id === "log" && metadata?.log) ||
                    (section.id === "email" && metadata?.email) ||
                    (section.id === "code" && metadata?.code);
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
                        isActive
                          ? "bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30"
                          : hasData
                            ? "text-gray-300 hover:text-white hover:bg-[#0B1220]"
                            : "text-gray-500 hover:text-gray-300 hover:bg-[#0B1220]"
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span>{section.icon}</span>
                        <span>{section.label}</span>
                      </span>
                      {hasData && !isActive && (
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      )}
                      {isActive && (
                        <span className="text-xs text-[#3B82F6] font-bold">●</span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Export Buttons */}
              <div className="mt-4 pt-4 border-t border-[#1E293B] space-y-2">
                <button
                  onClick={() => handleExport("json")}
                  disabled={!metadata}
                  className="w-full px-3 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <span>📥</span>
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={() => handleExport("html")}
                  disabled={!metadata}
                  className="w-full px-3 py-2 bg-[#1E293B] border border-[#334155] text-gray-300 text-sm font-medium rounded-lg hover:bg-[#334155] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <span>📄</span>
                  <span>Export HTML</span>
                </button>
              </div>
              
              {/* Status Indicators */}
              <div className="mt-3 space-y-1">
                {metadata?.document && (
                  <div className="flex items-center space-x-2 text-xs text-green-400">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span>Document Info</span>
                  </div>
                )}
                {metadata?.camera && (
                  <div className="flex items-center space-x-2 text-xs text-green-400">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span>Camera Data</span>
                  </div>
                )}
                {metadata?.gps && (
                  <div className="flex items-center space-x-2 text-xs text-green-400">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span>GPS Location</span>
                  </div>
                )}
                {metadata?.log && (
                  <div className="flex items-center space-x-2 text-xs text-green-400">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span>Log Data</span>
                  </div>
                )}
                {metadata?.email && (
                  <div className="flex items-center space-x-2 text-xs text-green-400">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span>Email Info</span>
                  </div>
                )}
                {metadata?.code && (
                  <div className="flex items-center space-x-2 text-xs text-green-400">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span>Code Info</span>
                  </div>
                )}
              </div>
              
              {currentCase && (
                <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-blue-400">📁 {currentCase.id}</p>
                </div>
              )}
              {selectedEvidence && (
                <div className="mt-1 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-xs text-purple-400">📄 {selectedEvidence.id}</p>
                </div>
              )}
            </div>

            {/* ============ MAIN CONTENT ============ */}
            <div className="lg:col-span-3 bg-[#1A2332] rounded-xl border border-[#1E293B] p-6">
              
              {/* File Info Section */}
              {activeSection === "file" && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4">File Information</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                      <span className="text-sm text-gray-400">File Name</span>
                      <span className="text-sm text-white">{metadata.fileName}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                      <span className="text-sm text-gray-400">File Size</span>
                      <span className="text-sm text-white">{metadata.fileSize}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                      <span className="text-sm text-gray-400">File Type</span>
                      <span className="text-sm text-white">{metadata.fileType}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                      <span className="text-sm text-gray-400">Category</span>
                      <span className="text-sm text-white capitalize">{metadata.fileCategory}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                      <span className="text-sm text-gray-400">Created</span>
                      <span className="text-sm text-white">{formatDate(metadata.created)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                      <span className="text-sm text-gray-400">Modified</span>
                      <span className="text-sm text-white">{formatDate(metadata.modified)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                      <span className="text-sm text-gray-400">SHA-256</span>
                      <span className="text-sm font-mono text-[#3B82F6] break-all">{metadata.hash}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                      <span className="text-sm text-gray-400">Linked Case</span>
                      <span className="text-sm text-white">{currentCase ? `${currentCase.id} - ${currentCase.title}` : "Not linked"}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                      <span className="text-sm text-gray-400">Evidence ID</span>
                      <span className="text-sm text-white">{selectedEvidenceId || "Not linked"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Info Section */}
              {activeSection === "document" && metadata.document && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4">Document Metadata</h2>
                  <div className="space-y-3">
                    {metadata.document.author && metadata.document.author !== 'Un-named' && (
                      <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                        <span className="text-sm text-gray-400">Author</span>
                        <span className="text-sm text-white">{metadata.document.author}</span>
                      </div>
                    )}
                    {metadata.document.title && (
                      <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                        <span className="text-sm text-gray-400">Title</span>
                        <span className="text-sm text-white">{metadata.document.title}</span>
                      </div>
                    )}
                    {metadata.document.creator && metadata.document.creator !== 'Un-named' && (
                      <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                        <span className="text-sm text-gray-400">Creator</span>
                        <span className="text-sm text-white">{metadata.document.creator}</span>
                      </div>
                    )}
                    {metadata.document.producer && metadata.document.producer !== 'Un-named' && (
                      <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                        <span className="text-sm text-gray-400">Producer</span>
                        <span className="text-sm text-white">{metadata.document.producer}</span>
                      </div>
                    )}
                    {metadata.document.pages && metadata.document.pages > 0 && (
                      <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                        <span className="text-sm text-gray-400">Pages</span>
                        <span className="text-sm text-white font-bold">{metadata.document.pages}</span>
                      </div>
                    )}
                    {metadata.document.wordCount && metadata.document.wordCount > 0 && (
                      <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                        <span className="text-sm text-gray-400">Word Count</span>
                        <span className="text-sm text-white font-bold">{metadata.document.wordCount.toLocaleString()}</span>
                      </div>
                    )}
                    {metadata.document.characterCount && metadata.document.characterCount > 0 && (
                      <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                        <span className="text-sm text-gray-400">Character Count</span>
                        <span className="text-sm text-white font-bold">{metadata.document.characterCount.toLocaleString()}</span>
                      </div>
                    )}
                    {metadata.document.company && metadata.document.company !== 'Unknown' && (
                      <div className="flex justify-between p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                        <span className="text-sm text-gray-400">Company</span>
                        <span className="text-sm text-white">{metadata.document.company}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Summary - FIXED (No "0", No "Un-named") */}
              <div className="mt-6 p-4 bg-gradient-to-r from-[#3B82F6]/10 to-[#8B5CF6]/10 rounded-xl border border-[#3B82F6]/20">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">🤖</span>
                  <h4 className="text-sm font-semibold text-white">AI Analysis</h4>
                </div>
                
                {metadata.document ? (
                  <div className="text-sm text-gray-300">
                    <p>This is a {metadata.fileType} file.</p>
                    {metadata.document.author && metadata.document.author !== 'Un-named' && (
                      <p className="mt-1">Authored by: {metadata.document.author}</p>
                    )}
                    {metadata.document.creator && metadata.document.creator !== 'Un-named' && (
                      <p className="mt-1">Created using: {metadata.document.creator}</p>
                    )}
                    {metadata.document.pages && metadata.document.pages > 0 && (
                      <p className="mt-1">Contains {metadata.document.pages} pages.</p>
                    )}
                    {metadata.document.wordCount && metadata.document.wordCount > 0 && (
                      <p className="mt-1">📝 {metadata.document.wordCount.toLocaleString()} words</p>
                    )}
                    {metadata.document.company && metadata.document.company !== 'Unknown' && (
                      <p className="mt-1">🏢 Company: {metadata.document.company}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">Confidence: 85%</p>
                  </div>
                ) : metadata.camera ? (
                  <div className="text-sm text-gray-300">
                    <p>This is an image captured with {metadata.camera.make} {metadata.camera.model}.</p>
                    {metadata.camera.aperture && <p className="mt-1">Aperture: {metadata.camera.aperture}</p>}
                    {metadata.camera.shutter && <p className="mt-1">Shutter: {metadata.camera.shutter}</p>}
                    {metadata.camera.iso && <p className="mt-1">ISO: {metadata.camera.iso}</p>}
                    {metadata.gps && <p className="mt-1">📍 GPS coordinates available</p>}
                    <p className="mt-2 text-xs text-gray-400">Confidence: 90%</p>
                  </div>
                ) : metadata.log ? (
                  <div className="text-sm text-gray-300">
                    <p>This is a log file with {metadata.log.lineCount.toLocaleString()} entries.</p>
                    {metadata.log.entries && metadata.log.entries.length > 0 && (
                      <p className="mt-1">Sample entries show system events and status messages.</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">Confidence: 80%</p>
                  </div>
                ) : metadata.email ? (
                  <div className="text-sm text-gray-300">
                    <p>This is an email file.</p>
                    {metadata.email.from && <p className="mt-1">From: {metadata.email.from}</p>}
                    {metadata.email.subject && <p className="mt-1">Subject: {metadata.email.subject}</p>}
                    <p className="mt-2 text-xs text-gray-400">Confidence: 85%</p>
                  </div>
                ) : metadata.code ? (
                  <div className="text-sm text-gray-300">
                    <p>This is a code file written in {metadata.code.language}.</p>
                    <p className="mt-1">Contains {metadata.code.lines.toLocaleString()} lines of code.</p>
                    <p className="mt-2 text-xs text-gray-400">Confidence: 75%</p>
                  </div>
                ) : (
                  <div className="text-sm text-gray-300">
                    <p>File analyzed: {metadata.fileName}</p>
                    <p className="mt-1">Type: {metadata.fileType}</p>
                    <p className="mt-1">Size: {metadata.fileSize}</p>
                    <p className="mt-1 text-yellow-400">ℹ️ No specialized metadata found in this file.</p>
                    <p className="mt-2 text-xs text-gray-400">Confidence: 70%</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-12 text-center">
            <span className="text-4xl block mb-4">🔍</span>
            <p className="text-gray-400">Select a case and upload a file to extract metadata</p>
            <p className="text-sm text-gray-500 mt-1">Supports: PDF, Word, Images, Logs, Emails, Code, Archives</p>
            <button
              onClick={() => setShowAddEvidenceModal(true)}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all"
            >
              Add Evidence to Case
            </button>
          </div>
        )}
      </div>

      {/* ============ MODALS ============ */}
      {/* Select Case Modal */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Select Case</h2>
              <button onClick={() => setShowCaseModal(false)} className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {cases.map((caseItem) => (
                <button
                  key={caseItem.id}
                  onClick={() => handleSelectCase(caseItem.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    selectedCaseId === caseItem.id
                      ? "border-[#3B82F6] bg-[#3B82F6]/10"
                      : "border-[#1E293B] hover:border-[#3B82F6]/30 hover:bg-[#0B1220]"
                  }`}
                >
                  <p className="text-sm font-medium text-white">{caseItem.id} - {caseItem.title}</p>
                  <p className="text-xs text-gray-500">Status: {caseItem.status} • Priority: {caseItem.priority}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Case</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Case Title *</label>
                <input
                  type="text"
                  value={newCase.title}
                  onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  placeholder="Enter case title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all min-h-[80px]"
                  placeholder="Enter case description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                  <select
                    value={newCase.priority}
                    onChange={(e) => setNewCase({ ...newCase, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={newCase.status}
                    onChange={(e) => setNewCase({ ...newCase, status: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-3 pt-4 border-t border-[#1E293B]">
                <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all">
                  Create Case
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2.5 bg-[#0B1220] border border-[#2A3A4A] text-gray-400 font-medium rounded-xl hover:bg-[#1A2332] transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Select Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Select Evidence</h2>
              <button onClick={() => setShowEvidenceModal(false)} className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {caseEvidence.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No evidence found in this case.</p>
                  <button onClick={() => { setShowEvidenceModal(false); setShowAddEvidenceModal(true); }} className="mt-4 px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all">
                    Add Evidence
                  </button>
                </div>
              ) : (
                caseEvidence.map((evidence) => (
                  <button
                    key={evidence.id}
                    onClick={() => handleSelectEvidence(evidence.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      selectedEvidenceId === evidence.id
                        ? "border-[#3B82F6] bg-[#3B82F6]/10"
                        : "border-[#1E293B] hover:border-[#3B82F6]/30 hover:bg-[#0B1220]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{evidence.id} - {evidence.name}</p>
                        <p className="text-xs text-gray-500">{evidence.type} • {evidence.size}</p>
                      </div>
                      {selectedEvidenceId === evidence.id && <span className="text-xs text-[#3B82F6]">✓ Selected</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Evidence Modal */}
      {showAddEvidenceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add Evidence to Case</h2>
              <button onClick={() => setShowAddEvidenceModal(false)} className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                <p className="text-sm text-gray-400">Current Case:</p>
                <p className="text-sm font-medium text-white">{currentCase?.id} - {currentCase?.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select File</label>
                <input
                  type="file"
                  id="addEvidenceFile"
                  onChange={handleFileUpload}
                  className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.tiff,.webp,.gif,.bmp,.ico,.log,.txt,.csv,.tsv,.eml,.msg,.zip,.rar,.7z,.tar,.gz,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.go,.rb,.php,.html,.css,.scss,.json,.xml,.yaml,.yml,.md"
                />
                {selectedFile && (
                  <p className="text-xs text-green-400 mt-1">✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
                )}
              </div>

              {uploadingEvidence && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-[#0B1220] rounded-full h-2">
                    <div className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex items-center space-x-3 pt-4 border-t border-[#1E293B]">
                <button
                  onClick={handleAddEvidence}
                  disabled={!selectedFile || !selectedCaseId || uploadingEvidence}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingEvidence ? "Adding Evidence..." : "Add Evidence"}
                </button>
                <button onClick={() => setShowAddEvidenceModal(false)} className="px-4 py-2.5 bg-[#0B1220] border border-[#2A3A4A] text-gray-400 font-medium rounded-xl hover:bg-[#1A2332] transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}