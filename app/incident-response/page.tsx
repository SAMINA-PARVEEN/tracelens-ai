"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PremiumLogo from "../components/ui/PremiumLogo";
import { supabase } from "../lib/supabase";

export default function IncidentResponsePage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    investigating: 0,
    contained: 0,
    closed: 0,
    critical: 0,
    high: 0,
  });

  // ============ NEW INCIDENT FORM ============
  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    category: "Phishing",
    severity: "Medium",
    priority: "Medium",
  });

  // ============ CASE SELECTOR STATE ============
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false);
  const [newCase, setNewCase] = useState({
    title: "",
    description: "",
    priority: "Medium",
    status: "Open",
  });

  // ============ LOAD REAL CASES FROM SUPABASE ============
  useEffect(() => {
    async function loadCases() {
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('id, case_id, title, status, priority')
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

  // ============ LOAD INCIDENTS FROM SUPABASE ============
  useEffect(() => {
    async function loadIncidents() {
      try {
        setLoading(true);
        
        let query = supabase
          .from('incidents')
          .select('*')
          .order('created_at', { ascending: false });

        if (selectedCaseId) {
          query = query.eq('case_id', selectedCaseId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error loading incidents:', error);
          setIncidents([]);
          setStats({ total: 0, open: 0, investigating: 0, contained: 0, closed: 0, critical: 0, high: 0 });
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          setIncidents(data);
          
          const total = data.length;
          const open = data.filter((i: any) => i.status === 'Open' || i.status === 'In Progress').length;
          const investigating = data.filter((i: any) => i.status === 'In Progress').length;
          const contained = data.filter((i: any) => i.status === 'Contained').length;
          const closed = data.filter((i: any) => i.status === 'Closed' || i.status === 'Resolved').length;
          const critical = data.filter((i: any) => i.severity === 'Critical').length;
          const high = data.filter((i: any) => i.severity === 'High').length;
          
          setStats({ total, open, investigating, contained, closed, critical, high });
        } else {
          setIncidents([]);
          setStats({ total: 0, open: 0, investigating: 0, contained: 0, closed: 0, critical: 0, high: 0 });
        }
      } catch (err) {
        console.error('Error loading incidents:', err);
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    }

    loadIncidents();
  }, [selectedCaseId]);

  // ============ FILTER INCIDENTS ============
  useEffect(() => {
    let result = incidents;

    if (selectedFilter !== "all") {
      result = result.filter(i => i.status === selectedFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(i =>
        i.title?.toLowerCase().includes(term) ||
        i.description?.toLowerCase().includes(term) ||
        i.incident_number?.toLowerCase().includes(term)
      );
    }

    setFilteredIncidents(result);
  }, [selectedFilter, searchTerm, incidents]);

  // ============ HANDLE CASE SELECTION ============
  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setShowCaseModal(false);
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
        .select('id, case_id, title, status, priority')
        .order('created_at', { ascending: false });

      if (updatedCases) {
        setCases(updatedCases);
        if (data && data.length > 0) {
          setSelectedCaseId(data[0].id);
        }
      }

      setShowCreateCaseModal(false);
      setNewCase({ title: "", description: "", priority: "Medium", status: "Open" });
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to create case. Please try again.');
    }
  };

  // ============ HANDLE CREATE INCIDENT ============
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);
      
      const orgId = orgData?.[0]?.id || null;

      const incidentNumber = `INC-${Date.now().toString().slice(-6)}`;
      const { data, error } = await supabase
        .from('incidents')
        .insert([{
          incident_number: incidentNumber,
          case_id: selectedCaseId || null,
          organization_id: orgId,
          created_by: profile.id,
          title: newIncident.title,
          description: newIncident.description,
          category: newIncident.category,
          severity: newIncident.severity,
          priority: newIncident.priority,
          status: 'Open',
          detected_at: new Date().toISOString(),
        }])
        .select();

      if (error) {
        console.error('Error creating incident:', error);
        alert('Failed to create incident. Please try again.');
        return;
      }

      setShowIncidentModal(false);
      setNewIncident({
        title: "",
        description: "",
        category: "Phishing",
        severity: "Medium",
        priority: "Medium",
      });
      
      // Reload incidents
      const { data: updatedIncidents } = await supabase
        .from('incidents')
        .select('*')
        .eq('case_id', selectedCaseId)
        .order('created_at', { ascending: false });

      if (updatedIncidents) {
        setIncidents(updatedIncidents);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to create incident. Please try again.');
    }
  };

  // ============ HANDLE VIEW INCIDENT ============
  const handleViewIncident = (incident: any) => {
    setSelectedIncident(incident);
    setShowIncidentModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Open': 'bg-red-500/20 text-red-400 border border-red-500/30',
      'In Progress': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      'Contained': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      'Resolved': 'bg-green-500/20 text-green-400 border border-green-500/30',
      'Closed': 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      'Low': 'bg-green-500/20 text-green-400 border border-green-500/30',
      'Medium': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      'High': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      'Critical': 'bg-red-500/20 text-red-400 border border-red-500/30',
    };
    return colors[severity] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  };

  const currentCase = cases.find(c => c.id === selectedCaseId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading incidents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1220]">
      
      {/* ===== NAVBAR ===== */}
      <nav className="bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1E293B] px-6 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <PremiumLogo size="md" variant="white" />
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/incident-response" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Incident Response</Link>
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

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Incident Response</h1>
            <p className="text-gray-400">NIST-based incident response management</p>
          </div>
          <button
            onClick={() => setShowIncidentModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Incident</span>
          </button>
        </div>

        {/* ============ CASE SELECTOR ============ */}
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
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCaseModal(true)}
                className="px-4 py-2 text-sm bg-[#0B1220] border border-[#2A3A4A] text-gray-300 rounded-xl hover:bg-[#1E293B] transition-all"
              >
                Select Case
              </button>
              <button
                onClick={() => setShowCreateCaseModal(true)}
                className="px-4 py-2 text-sm bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all"
              >
                + New Case
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {stats.total > 0 && (
          <div className="grid grid-cols-4 md:grid-cols-7 gap-4 mb-6">
            <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Open</p>
              <p className="text-2xl font-bold text-red-400">{stats.open}</p>
            </div>
            <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Investigating</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.investigating}</p>
            </div>
            <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Contained</p>
              <p className="text-2xl font-bold text-blue-400">{stats.contained}</p>
            </div>
            <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Closed</p>
              <p className="text-2xl font-bold text-green-400">{stats.closed}</p>
            </div>
            <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Critical</p>
              <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
            </div>
            <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">High</p>
              <p className="text-2xl font-bold text-orange-400">{stats.high}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
              />
            </div>

            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
            >
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">Investigating</option>
              <option value="Contained">Contained</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Incidents List */}
        <div className="space-y-4">
          {filteredIncidents.length === 0 ? (
            <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-12 text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-gray-400">No incidents found</p>
              <p className="text-sm text-gray-500 mt-1">Create a new incident or adjust your filters</p>
            </div>
          ) : (
            filteredIncidents.map((incident) => (
              <div
                key={incident.id}
                className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-5 hover:border-[#3B82F6]/30 transition-all cursor-pointer"
                onClick={() => handleViewIncident(incident)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-sm font-semibold text-white">{incident.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                        {incident.status.toUpperCase()}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">{incident.category?.toUpperCase() || 'Unknown'}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">{incident.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>📅 {incident.created_at ? new Date(incident.created_at).toLocaleDateString() : 'N/A'}</span>
                      <span>📁 {incident.case_id ? incident.case_id.slice(0, 8) : 'No Case'}</span>
                      <span>🔢 {incident.incident_number || incident.id.slice(0, 8)}</span>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-[#3B82F6]/20 text-[#3B82F6] rounded-lg text-xs font-medium hover:bg-[#3B82F6]/30 transition">
                    View Details →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============ CREATE INCIDENT MODAL ============ */}
      {showIncidentModal && !selectedIncident && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Incident</h2>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Incident Title *</label>
                <input
                  type="text"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  placeholder="Enter incident title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                <textarea
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  placeholder="Describe the incident..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={newIncident.category}
                    onChange={(e) => setNewIncident({ ...newIncident, category: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  >
                    <option value="Malware">Malware</option>
                    <option value="Phishing">Phishing</option>
                    <option value="Ransomware">Ransomware</option>
                    <option value="Data Breach">Data Breach</option>
                    <option value="Unauthorized Access">Unauthorized Access</option>
                    <option value="Insider Threat">Insider Threat</option>
                    <option value="DDoS">DDoS</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Severity</label>
                  <select
                    value={newIncident.severity}
                    onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all"
              >
                Create Incident
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============ VIEW INCIDENT MODAL ============ */}
      {selectedIncident && showIncidentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedIncident.title}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedIncident.status)}`}>
                    {selectedIncident.status.toUpperCase()}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(selectedIncident.severity)}`}>
                    {selectedIncident.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">{selectedIncident.category?.toUpperCase() || 'Unknown'}</span>
                  <span className="text-xs text-gray-400">{selectedIncident.incident_number || selectedIncident.id.slice(0, 8)}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowIncidentModal(false);
                  setSelectedIncident(null);
                }}
                className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                <p className="text-xs text-gray-500">Description</p>
                <p className="text-sm text-gray-300 mt-1">{selectedIncident.description}</p>
              </div>
              <div className="p-3 bg-[#0B1220] rounded-lg border border-[#1E293B]">
                <p className="text-xs text-gray-500">Case ID</p>
                <p className="text-sm text-white">{selectedIncident.case_id || 'No Case'}</p>
                <p className="text-xs text-gray-500 mt-2">Created: {selectedIncident.created_at ? new Date(selectedIncident.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ SELECT CASE MODAL ============ */}
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
                  <p className="text-sm font-medium text-white">{caseItem.case_id} - {caseItem.title}</p>
                  <p className="text-xs text-gray-500">Status: {caseItem.status} • Priority: {caseItem.priority}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ CREATE CASE MODAL ============ */}
      {showCreateCaseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Case</h2>
              <button onClick={() => setShowCreateCaseModal(false)} className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg">
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
                  required
                  className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  placeholder="Enter case title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
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
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
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
              <button
                type="submit"
                className="w-full px-4 py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all"
              >
                Create Case
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}