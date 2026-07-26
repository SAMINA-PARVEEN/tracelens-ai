"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import PremiumLogo from "../components/ui/PremiumLogo";
import { performOSINTSearch, OSINTResult } from "../lib/osintService";
import { supabase } from "../lib/supabase";

export default function OSINTPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [searchType, setSearchType] = useState<"username" | "email" | "phone" | "name" | "photo">("username");
  const [osintResult, setOsintResult] = useState<OSINTResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
            metadata: null
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
    setError("");
    setExtractedFromCase(false);
    setHasResult(false);
    setOsintResult(null);
  };

  // ============ HANDLE EVIDENCE SELECTION ============
  const handleSelectEvidence = (evidenceId: string) => {
    setSelectedEvidenceId(evidenceId);
    setShowEvidenceModal(false);
    setExtractedFromCase(true);
    const evidence = caseEvidence.find(e => e.id === evidenceId);
    if (evidence) {
      setHasResult(false);
      setOsintResult(null);
      setError(null);
    }
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
    if (!osintResult || !selectedCaseId) {
      setError("Please perform OSINT search first and select a case!");
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
          file_name: `OSINT_${searchType}_${searchQuery}`,
          file_type: 'osint_result',
          file_size: 0,
          hash_sha256: hashValue,
          description: `OSINT search result for ${searchType}: ${searchQuery}`,
        }])
        .select();

      if (error) {
        console.error('Error uploading evidence:', error);
        setError('Failed to add evidence. Please try again.');
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
          metadata: osintResult
        }));
        setCaseEvidence(mappedEvidence);
        if (mappedEvidence.length > 0) {
          setSelectedEvidenceId(mappedEvidence[0].id);
        }
      }

      setShowAddEvidenceModal(false);
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

  // ============ OSINT SEARCH ============
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search query!");
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const result = await performOSINTSearch(searchQuery.trim(), searchType);
      setOsintResult(result);
      setHasResult(true);
    } catch (err) {
      setError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    const styles: Record<string, string> = {
      High: 'bg-red-500/20 text-red-400 border-red-500/30',
      Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      Low: 'bg-green-500/20 text-green-400 border-green-500/30',
      Unknown: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return styles[risk] || styles.Low;
  };

  const searchTypes = [
    { value: "username", label: "Username Search", icon: "👤" },
    { value: "email", label: "Email Search", icon: "📧" },
    { value: "name", label: "Name Search", icon: "📝" },
    { value: "phone", label: "Phone Search", icon: "📱" },
    { value: "photo", label: "Photo Search", icon: "🖼️" },
  ];

  const placeholderMap = {
    username: "Enter username...",
    email: "Enter email...",
    name: "Enter full name...",
    phone: "Enter phone number...",
    photo: "Enter image description...",
  };

  return (
    <div className="min-h-screen bg-[#0B1220]">
      
      {/* ===== NAVBAR ===== */}
      <nav className="bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1E293B] px-6 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <PremiumLogo size="md" variant="white" />
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/osint" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">OSINT</Link>
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
            <h1 className="text-2xl font-bold text-white">OSINT Investigation</h1>
            <p className="text-gray-400">AI-powered open source intelligence gathering</p>
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
              <p className="text-xs text-green-400">✅ OSINT results loaded from case evidence</p>
            </div>
          )}
        </div>

        {/* ============ SEARCH AREA ============ */}
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-6">
          {/* Search Type Selector */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Search Method</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {searchTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSearchType(type.value as typeof searchType)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    searchType === type.value
                      ? "bg-[#3B82F6] text-white"
                      : "bg-[#0B1220] text-gray-400 hover:text-white border border-[#2A3A4A]"
                  }`}
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder={placeholderMap[searchType] || "Enter search query..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {searching ? "Searching..." : "🔍 Search"}
              </button>
            </div>
            <p className="text-xs text-gray-500">💡 Tip: Try variations of the search term if not found</p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Loading State */}
          {searching && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-400 mt-4">Searching intelligence sources...</p>
            </div>
          )}

          {/* ============ RESULTS ============ */}
          {hasResult && osintResult && (
            <div className="mt-6 space-y-4">
              {/* Search Completed Banner */}
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <p className="text-sm text-green-400">✅ Search completed!</p>
              </div>

              {/* Risk Banner */}
              <div className={`p-4 rounded-lg border ${getRiskBadge(osintResult.riskLevel)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${osintResult.riskLevel === 'High' ? 'text-red-400' : osintResult.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                      {osintResult.found ? '✅ Found' : '⚠️ Not Found'}
                    </p>
                    <p className="text-xs text-gray-400">Risk Level: {osintResult.riskLevel}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getRiskBadge(osintResult.riskLevel)}`}>
                    {osintResult.riskLevel}
                  </span>
                </div>
              </div>

              {/* Search Results */}
              {osintResult.found ? (
                <>
                  {/* Username */}
                  <div className="p-4 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                    <p className="text-xs text-gray-500">Username</p>
                    <p className="text-lg font-semibold text-white">@{osintResult.query}</p>
                  </div>

                  {/* Social Media Profiles */}
                  {osintResult.profiles && osintResult.profiles.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-white">Social Media Profiles</h3>
                      <div className="space-y-2">
                        {osintResult.profiles.map((profile, idx) => (
                          <div key={idx} className="p-3 bg-[#0B1220] rounded-lg border border-[#1E293B] flex items-center justify-between">
                            <div>
                              <p className="text-sm text-white font-medium">{profile.platform}</p>
                              <p className="text-xs text-[#3B82F6]">{profile.username}</p>
                              {profile.followers && (
                                <p className="text-xs text-gray-500">👥 {profile.followers} followers</p>
                              )}
                            </div>
                            <a
                              href={profile.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[#3B82F6] hover:text-[#60A5FA]"
                            >
                              View →
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Websites & References */}
                  {osintResult.websites && osintResult.websites.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-white">Websites & References</h3>
                      <div className="space-y-2">
                        {osintResult.websites.map((site, idx) => (
                          <div key={idx} className="p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                            <p className="text-sm text-white font-medium">{site.title}</p>
                            <p className="text-xs text-gray-400">{site.description}</p>
                            <a
                              href={site.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#3B82F6] hover:text-[#60A5FA] mt-1 inline-block"
                            >
                              {site.url}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="p-4 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">AI Summary</p>
                    <p className="text-sm text-gray-300">{osintResult.summary}</p>
                    <p className="text-xs text-gray-400 mt-2">Confidence: {osintResult.confidence}</p>
                  </div>

                  {/* Recommendations */}
                  {osintResult.recommendations && osintResult.recommendations.length > 0 && (
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <p className="text-xs text-blue-400 uppercase tracking-wider">💡 Recommendations</p>
                      <ul className="mt-2 space-y-1 text-sm text-gray-300">
                        {osintResult.recommendations.map((rec, idx) => (
                          <li key={idx}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                  <p className="text-sm text-yellow-400">No information found</p>
                  <p className="text-sm text-gray-300 mt-1">{osintResult.summary}</p>
                </div>
              )}
            </div>
          )}
        </div>
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

              <div className="p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                <p className="text-sm text-gray-400">OSINT Result to Add:</p>
                {osintResult ? (
                  <p className="text-sm text-green-400 mt-1">✅ {osintResult.query} ({osintResult.type})</p>
                ) : (
                  <p className="text-sm text-yellow-400 mt-1">⚠️ No OSINT results to add. Perform a search first.</p>
                )}
              </div>

              {uploadingEvidence && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                    <span>Adding evidence...</span>
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
                  disabled={!osintResult || !selectedCaseId || uploadingEvidence}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingEvidence ? "Adding Evidence..." : "Add Evidence to Case"}
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