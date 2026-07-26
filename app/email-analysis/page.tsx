"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import PremiumLogo from "../components/ui/PremiumLogo";
import { analyzeLogs, LogAnalysisResult } from "../lib/logAnalysisService";
import { supabase } from "../lib/supabase";

export default function LogAnalysisPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<LogAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [evidenceFileContent, setEvidenceFileContent] = useState<string | null>(null);

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
            content: null
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

  const currentCase = cases.find(c => c.id === selectedCaseId);
  const selectedEvidence = caseEvidence.find(e => e.id === selectedEvidenceId);

  // ============ HANDLE CASE SELECTION ============
  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setShowCaseModal(false);
    setSelectedFile(null);
    setError("");
    setExtractedFromCase(false);
    setHasResult(false);
    setAnalysisResult(null);
    setEvidenceFileContent(null);
  };

  // ============ HANDLE EVIDENCE SELECTION ============
  const handleSelectEvidence = (evidenceId: string) => {
    setSelectedEvidenceId(evidenceId);
    setShowEvidenceModal(false);
    setExtractedFromCase(true);
    setSelectedFile(null);
    setHasResult(false);
    setAnalysisResult(null);
    setError(null);
    setEvidenceFileContent(null);
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
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 300);

      const hashValue = Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      const { data, error } = await supabase
        .from('evidence')
        .insert([{
          evidence_id: `E-${Date.now().toString().slice(-6)}`,
          case_id: selectedCaseId,
          file_name: selectedFile.name,
          file_type: selectedFile.type || 'text/plain',
          file_size: selectedFile.size,
          hash_sha256: hashValue,
          description: `Uploaded via Log Analysis`,
        }])
        .select();

      if (error) {
        console.error('Error uploading evidence:', error);
        setError('Failed to upload evidence. Please try again.');
        setUploadingEvidence(false);
        return;
      }

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
          content: null
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

  const performAnalysis = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const text = await file.text();
      const result = await analyzeLogs(text);
      setAnalysisResult(result);
      setHasResult(true);
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to analyze logs. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setHasResult(false);
    setAnalysisResult(null);
    setError(null);
    setExtractedFromCase(false);
    setEvidenceFileContent(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      performAnalysis(selectedFile);
    } else {
      setError("Please upload a log file first!");
    }
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setHasResult(false);
    setAnalysisResult(null);
    setError(null);
  };

  const getRiskBadge = (level: string) => {
    const styles: Record<string, string> = {
      Low: 'bg-green-500/20 text-green-400 border-green-500/30',
      Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return styles[level] || styles.Low;
  };

  return (
    <div className="min-h-screen bg-[#0B1220]">
      
      {/* ===== NAVBAR ===== */}
      <nav className="bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1E293B] px-6 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <PremiumLogo size="md" variant="white" />
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/log-analysis" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Log Analysis</Link>
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

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Log Analysis</h1>
            <p className="text-gray-400">AI-powered log file analysis for threat detection</p>
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
          {extractedFromCase && selectedEvidence && (
            <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-xs text-green-400">✅ Evidence selected from case</p>
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-6">
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
              dragActive ? "border-[#3B82F6] bg-[#3B82F6]/10" : "border-[#2A3A4A] hover:border-[#3B82F6]/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleClickUpload}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".log,.txt,.csv"
            />
            
            <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            
            {selectedFile ? (
              <div>
                <p className="text-green-400 font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                <button 
                  onClick={handleRemoveFile}
                  className="mt-2 text-sm text-red-400 hover:text-red-300"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <>
                <p className="text-gray-400">Upload log files for AI analysis</p>
                <p className="text-sm text-gray-500 mt-2">Supports: .log, .txt, .csv</p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          <div className="mt-4 flex justify-center">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !selectedFile}
              className="px-6 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Logs"}
            </button>
          </div>

          {isAnalyzing && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-400 mt-4">AI is analyzing log files...</p>
            </div>
          )}

          {/* Results */}
          {hasResult && analysisResult && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Analysis Results</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskBadge(analysisResult.riskLevel)}`}>
                  Risk: {analysisResult.riskLevel}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                  <p className="text-sm text-gray-400">Safe Events</p>
                  <p className="text-2xl font-bold text-green-400">{analysisResult.safeEvents.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                  <p className="text-sm text-gray-400">Suspicious</p>
                  <p className="text-2xl font-bold text-yellow-400">{analysisResult.suspicious.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-red-500/20 rounded-lg border border-red-500/30">
                  <p className="text-sm text-gray-400">Threats</p>
                  <p className="text-2xl font-bold text-red-400">{analysisResult.threats.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <p className="text-sm text-gray-400">Total Lines</p>
                  <p className="text-2xl font-bold text-blue-400">{analysisResult.totalLines.toLocaleString()}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-[#0B1220] rounded-lg border border-[#1E293B] mb-4">
                <p className="text-sm text-gray-300">{analysisResult.summary}</p>
              </div>

              {/* Key Findings */}
              {analysisResult.keyFindings && analysisResult.keyFindings.length > 0 && (
                <div className="p-4 bg-[#0B1220] rounded-lg border border-[#1E293B] mb-4">
                  <h4 className="text-sm font-semibold text-white mb-2">🔍 Key Findings</h4>
                  <ul className="space-y-1">
                    {analysisResult.keyFindings.map((finding, idx) => (
                      <li key={idx} className="text-sm text-gray-300">• {finding}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                <div className="p-4 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                  <h4 className="text-sm font-semibold text-white mb-2">💡 Recommendations</h4>
                  <ul className="space-y-1">
                    {analysisResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-300">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============ SELECT CASE MODAL ============ */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Select Case</h2>
              <button
                onClick={() => setShowCaseModal(false)}
                className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
              >
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{caseItem.id} - {caseItem.title}</p>
                      <p className="text-xs text-gray-500">Status: {caseItem.status} • Priority: {caseItem.priority}</p>
                    </div>
                    {selectedCaseId === caseItem.id && (
                      <span className="text-xs text-[#3B82F6]">✓ Selected</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ CREATE CASE MODAL ============ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Case</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
              >
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
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all"
                >
                  Create Case
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-[#0B1220] border border-[#2A3A4A] text-gray-400 font-medium rounded-xl hover:bg-[#1A2332] transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ SELECT EVIDENCE MODAL ============ */}
      {showEvidenceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Select Evidence</h2>
              <button
                onClick={() => setShowEvidenceModal(false)}
                className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {caseEvidence.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No evidence found in this case.</p>
                  <button
                    onClick={() => {
                      setShowEvidenceModal(false);
                      setShowAddEvidenceModal(true);
                    }}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all"
                  >
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
                      {selectedEvidenceId === evidence.id && (
                        <span className="text-xs text-[#3B82F6]">✓ Selected</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ ADD EVIDENCE MODAL ============ */}
      {showAddEvidenceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add Evidence to Case</h2>
              <button
                onClick={() => setShowAddEvidenceModal(false)}
                className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
              >
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
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  accept=".log,.txt,.csv"
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
                <button
                  onClick={() => setShowAddEvidenceModal(false)}
                  className="px-4 py-2.5 bg-[#0B1220] border border-[#2A3A4A] text-gray-400 font-medium rounded-xl hover:bg-[#1A2332] transition-all"
                >
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