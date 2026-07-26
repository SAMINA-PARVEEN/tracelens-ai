"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import PremiumLogo from "../components/ui/PremiumLogo";
import { supabase } from "../lib/supabase";

export default function EmailAnalysisPage() {
  const [emailContent, setEmailContent] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============ ALLOWED FILE TYPES ============
  const ALLOWED_FILE_TYPES = ['.eml', '.msg', '.txt'];
  const ALLOWED_MIME_TYPES = [
    'message/rfc822',
    'application/vnd.ms-outlook',
    'text/plain',
    'text/x-email',
    'application/octet-stream'
  ];

  // ============ LOAD CASES ============
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
        }
      } catch (err) {
        console.error('Error:', err);
      }
    }

    loadCases();
  }, []);

  // ============ LOAD SAVED ANALYSES ============
  useEffect(() => {
    async function loadSavedAnalyses() {
      if (!selectedCaseId) return;
      
      setLoadingSaved(true);
      try {
        const { data, error } = await supabase
          .from('email_analysis')
          .select('*')
          .eq('case_id', selectedCaseId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading analyses:', error);
          return;
        }

        setSavedAnalyses(data || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoadingSaved(false);
      }
    }

    loadSavedAnalyses();
  }, [selectedCaseId]);

  // ============ VALIDATE FILE ============
  const isValidEmailFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const fileExtension = '.' + fileName.split('.').pop();
    
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      setError(`❌ Invalid file type. Please upload: ${ALLOWED_FILE_TYPES.join(', ')}`);
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('❌ File is too large. Maximum size is 10MB.');
      return false;
    }

    return true;
  };

  // ============ HANDLE FILE UPLOAD ============
  const handleFileSelect = (file: File) => {
    setError("");
    
    if (!isValidEmailFile(file)) {
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setEmailContent(content);
    };
    reader.onerror = () => {
      setError("Failed to read file. Please try again.");
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
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

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setEmailContent("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ============ HANDLE EMAIL ANALYSIS ============
  const handleAnalyze = async () => {
    if (!emailContent.trim()) {
      setError("Please paste email content or upload a file to analyze.");
      return;
    }

    if (!selectedCaseId) {
      setError("Please select a case first.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/email/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: emailContent,
          caseId: selectedCaseId,
          fileName: selectedFile?.name || "pasted_content"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setAnalysisResult(data);

      // Get current user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      const profileId = profileData?.[0]?.id || null;

      // Get evidence ID if available
      let evidenceId = null;
      if (selectedFile) {
        const { data: existingEvidence } = await supabase
          .from('evidence')
          .select('id')
          .eq('case_id', selectedCaseId)
          .eq('file_name', selectedFile.name)
          .limit(1);
        
        if (existingEvidence && existingEvidence.length > 0) {
          evidenceId = existingEvidence[0].id;
        } else {
          const { data: newEvidence } = await supabase
            .from('evidence')
            .insert([{
              evidence_id: `E-${Date.now().toString().slice(-6)}`,
              case_id: selectedCaseId,
              file_name: selectedFile.name,
              file_type: selectedFile.type || 'text/plain',
              file_size: selectedFile.size,
              description: `Email file uploaded for analysis`,
            }])
            .select()
            .single();
          
          if (newEvidence) {
            evidenceId = newEvidence.id;
          }
        }
      }

      // Save to database using your schema
      const { error: saveError } = await supabase
        .from('email_analysis')
        .insert([{
          case_id: selectedCaseId,
          evidence_id: evidenceId,
          analyzed_by: profileId,
          sender_email: data.sender || null,
          sender_name: data.sender_name || null,
          recipient_email: data.recipient || null,
          cc: data.cc || [],
          bcc: data.bcc || [],
          subject: data.subject || null,
          message_id: data.message_id || null,
          reply_to: data.reply_to || null,
          return_path: data.return_path || null,
          sent_at: data.date ? new Date(data.date).toISOString() : null,
          received_at: new Date().toISOString(),
          authentication_results: {
            spf: data.spf_status || null,
            dkim: data.dkim_status || null,
            dmarc: data.dmarc_status || null
          },
          attachment_count: data.attachment_count || 0,
          attachment_names: data.attachment_names || [],
          suspicious_links: data.suspicious_urls || [],
          suspicious_ips: data.suspicious_ips || [],
          phishing_score: data.risk_score || 0,
          spam_score: data.spam_score || 0,
          malware_detected: data.malware_detected || false,
          risk_level: data.risk_level || 'Low',
          ai_summary: data.summary || '',
        }]);

      if (saveError) {
        console.error('Error saving analysis:', saveError);
        setError('Failed to save analysis to database: ' + saveError.message);
      } else {
        const { data: updated } = await supabase
          .from('email_analysis')
          .select('*')
          .eq('case_id', selectedCaseId)
          .order('created_at', { ascending: false });

        setSavedAnalyses(updated || []);
      }

    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "Failed to analyze email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setShowCaseModal(false);
    setAnalysisResult(null);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getFileIcon = (fileName: string) => {
    if (!fileName) return "📝";
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'eml': return "📧";
      case 'msg': return "📨";
      case 'txt': return "📄";
      default: return "📎";
    }
  };

  const currentCase = cases.find(c => c.id === selectedCaseId);

  return (
    <div className="min-h-screen bg-[#0B1220]">
      
      {/* NAVBAR */}
      <nav className="bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1E293B] px-6 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
            <PremiumLogo size="md" variant="white" />
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/email-analysis" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Email Analysis
            </Link>
            <Link href="/log-analysis" className="text-sm text-gray-400 hover:text-white transition-colors">
              Log Analysis
            </Link>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center font-semibold text-sm text-white">
              S
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">📧 Email Analysis</h1>
            <p className="text-gray-400">Analyze email headers, content, and metadata for forensic investigation</p>
          </div>
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

        {/* Upload & Analysis Input */}
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-6 mb-6">
          
          {/* File Upload Area */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload Email File (Optional)
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
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
                accept=".eml,.msg,.txt"
              />
              
              <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              
              {selectedFile ? (
                <div>
                  <p className="text-green-400 font-medium flex items-center justify-center gap-2">
                    <span>{getFileIcon(selectedFile.name)}</span>
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                    className="mt-2 text-sm text-red-400 hover:text-red-300"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-gray-400">Drop email files here or click to browse</p>
                  <p className="text-sm text-gray-500 mt-1">Supports: .eml, .msg, .txt (Max 10MB)</p>
                </>
              )}
            </div>
          </div>

          {/* OR Divider */}
          <div className="flex items-center gap-4 my-4">
            <hr className="flex-1 border-[#2A3A4A]" />
            <span className="text-xs text-gray-500">OR</span>
            <hr className="flex-1 border-[#2A3A4A]" />
          </div>

          {/* Manual Paste */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Paste Email Content (headers + body)
            </label>
            <textarea
              className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all min-h-[200px] font-mono text-sm"
              placeholder="Paste complete email content here including headers (From, To, Subject, Date, SPF, DKIM, DMARC results)..."
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
            />
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          <div className="mt-4 flex justify-center">
            <button
              onClick={handleAnalyze}
              disabled={loading || !emailContent.trim() || !selectedCaseId}
              className="px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⟳</span>
                  Analyzing...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  Analyze Email
                </>
              )}
            </button>
          </div>

          {selectedFile && !loading && (
            <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-xs text-green-400 flex items-center gap-2">
                <span>✅</span>
                File loaded: {selectedFile.name} - Ready for analysis
              </p>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Analysis Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisResult.sender && (
                <div className="p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                  <span className="text-xs text-gray-500">From</span>
                  <p className="text-white font-medium">{analysisResult.sender}</p>
                </div>
              )}
              {analysisResult.recipient && (
                <div className="p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                  <span className="text-xs text-gray-500">To</span>
                  <p className="text-white font-medium">{analysisResult.recipient}</p>
                </div>
              )}
              {analysisResult.subject && (
                <div className="p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                  <span className="text-xs text-gray-500">Subject</span>
                  <p className="text-white font-medium">{analysisResult.subject}</p>
                </div>
              )}
              {analysisResult.date && (
                <div className="p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                  <span className="text-xs text-gray-500">Date</span>
                  <p className="text-white font-medium">{analysisResult.date}</p>
                </div>
              )}
              {analysisResult.attachment_count > 0 && (
                <div className="p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                  <span className="text-xs text-gray-500">Attachments</span>
                  <p className="text-white font-medium">{analysisResult.attachment_count} files</p>
                </div>
              )}
              {analysisResult.malware_detected && (
                <div className="p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                  <span className="text-xs text-red-400">⚠️ Malware Detected</span>
                  <p className="text-white font-medium">Suspicious content found</p>
                </div>
              )}
            </div>

            {(analysisResult.spf_status || analysisResult.dkim_status || analysisResult.dmarc_status) && (
              <div className="mt-4 p-4 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Authentication Status</h4>
                <div className="grid grid-cols-3 gap-2">
                  {analysisResult.spf_status && (
                    <div className="text-center p-2 bg-[#1A2332] rounded">
                      <span className="text-xs text-gray-500">SPF</span>
                      <p className={`text-sm font-medium ${analysisResult.spf_status === 'Pass' ? 'text-green-400' : 'text-red-400'}`}>
                        {analysisResult.spf_status}
                      </p>
                    </div>
                  )}
                  {analysisResult.dkim_status && (
                    <div className="text-center p-2 bg-[#1A2332] rounded">
                      <span className="text-xs text-gray-500">DKIM</span>
                      <p className={`text-sm font-medium ${analysisResult.dkim_status === 'Pass' ? 'text-green-400' : 'text-red-400'}`}>
                        {analysisResult.dkim_status}
                      </p>
                    </div>
                  )}
                  {analysisResult.dmarc_status && (
                    <div className="text-center p-2 bg-[#1A2332] rounded">
                      <span className="text-xs text-gray-500">DMARC</span>
                      <p className={`text-sm font-medium ${analysisResult.dmarc_status === 'Pass' ? 'text-green-400' : 'text-red-400'}`}>
                        {analysisResult.dmarc_status}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {analysisResult.risk_level && (
              <div className="mt-4 p-4 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Risk Level</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(analysisResult.risk_level)}`}>
                    {analysisResult.risk_level}
                  </span>
                </div>
                {analysisResult.risk_score !== undefined && (
                  <div className="mt-2 flex items-center">
                    <div className="flex-1 h-2 bg-[#1A2332] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          analysisResult.risk_score > 70 ? 'bg-red-500' :
                          analysisResult.risk_score > 40 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(analysisResult.risk_score, 100)}%` }}
                      />
                    </div>
                    <span className="ml-3 text-sm text-gray-400">{analysisResult.risk_score}%</span>
                  </div>
                )}
              </div>
            )}

            {analysisResult.summary && (
              <div className="mt-4 p-4 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                <h4 className="text-sm font-medium text-gray-400 mb-2">AI Summary</h4>
                <p className="text-white text-sm leading-relaxed">{analysisResult.summary}</p>
              </div>
            )}

            {analysisResult.findings && analysisResult.findings.length > 0 && (
              <div className="mt-4 p-4 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Findings</h4>
                <ul className="space-y-1">
                  {analysisResult.findings.map((finding: string, idx: number) => (
                    <li key={idx} className="text-sm text-white flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">•</span>
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.suspicious_urls && analysisResult.suspicious_urls.length > 0 && (
              <div className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                <h4 className="text-sm font-medium text-red-400 mb-2">⚠️ Suspicious URLs Detected</h4>
                <ul className="space-y-1">
                  {analysisResult.suspicious_urls.map((url: string, idx: number) => (
                    <li key={idx} className="text-sm text-white font-mono break-all">{url}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.phishing_indicators && analysisResult.phishing_indicators.length > 0 && (
              <div className="mt-4 p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                <h4 className="text-sm font-medium text-orange-400 mb-2">🎣 Phishing Indicators</h4>
                <ul className="space-y-1">
                  {analysisResult.phishing_indicators.map((indicator: string, idx: number) => (
                    <li key={idx} className="text-sm text-white">{indicator}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
              <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <h4 className="text-sm font-medium text-blue-400 mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {analysisResult.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm text-white flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Saved Analyses */}
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📋 Saved Email Analyses</h2>
          
          {loadingSaved ? (
            <div className="text-center py-8 text-gray-400">Loading saved analyses...</div>
          ) : savedAnalyses.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No email analyses saved for this case.
            </div>
          ) : (
            <div className="space-y-3">
              {savedAnalyses.map((analysis) => (
                <div 
                  key={analysis.id}
                  className="p-4 bg-[#0B1220] rounded-lg border border-[#1E293B] hover:border-[#3B82F6]/30 transition-all cursor-pointer"
                  onClick={() => {
                    setEmailContent(analysis.email_content || "");
                    setAnalysisResult({
                      sender: analysis.sender_email,
                      sender_name: analysis.sender_name,
                      recipient: analysis.recipient_email,
                      subject: analysis.subject,
                      date: analysis.sent_at,
                      spf_status: analysis.authentication_results?.spf,
                      dkim_status: analysis.authentication_results?.dkim,
                      dmarc_status: analysis.authentication_results?.dmarc,
                      suspicious_urls: analysis.suspicious_links || [],
                      phishing_indicators: analysis.phishing_indicators || [],
                      risk_score: analysis.phishing_score,
                      risk_level: analysis.risk_level,
                      summary: analysis.ai_summary,
                      findings: analysis.findings || [],
                      recommendations: analysis.recommendations || [],
                      attachment_count: analysis.attachment_count,
                      malware_detected: analysis.malware_detected
                    });
                  }}
                >
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {analysis.file_name && (
                          <span className="text-sm">{getFileIcon(analysis.file_name)}</span>
                        )}
                        {analysis.malware_detected && (
                          <span className="text-xs text-red-400">⚠️</span>
                        )}
                        <p className="text-sm font-medium text-white">
                          {analysis.subject || "No Subject"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">From: {analysis.sender_email || "Unknown"}</span>
                        <span className="text-xs text-gray-500">To: {analysis.recipient_email || "Unknown"}</span>
                        {analysis.attachment_count > 0 && (
                          <span className="text-xs text-gray-500">📎 {analysis.attachment_count}</span>
                        )}
                        <span className="text-xs text-gray-500">{formatDate(analysis.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(analysis.risk_level)}`}>
                        {analysis.risk_level || "Unknown"}
                      </span>
                      {analysis.phishing_score > 0 && (
                        <span className="text-xs text-gray-500">{analysis.phishing_score}%</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Select Case Modal */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Select Case</h2>
              <button onClick={() => setShowCaseModal(false)} className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg">
                ✕
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