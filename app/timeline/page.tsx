"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PremiumLogo from "../components/ui/PremiumLogo";
import { supabase } from "../lib/supabase";

interface TimelineEvent {
  id: string;
  case_id: string;
  event_type: string;
  title: string;
  description: string;
  severity: string;
  source: string;
  event_time: string;
  created_at: string;
}

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    evidence: 0,
    response: 0,
    incident: 0,
    analysis: 0,
  });

  // ============ CASE SELECTOR STATE ============
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  // ============ LOAD TIMELINE EVENTS FROM SUPABASE ============
  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        
        let query = supabase
          .from('timeline_events')
          .select('*')
          .order('event_time', { ascending: true });

        if (selectedCaseId) {
          query = query.eq('case_id', selectedCaseId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error loading timeline events:', error);
          // If table doesn't exist or has no data, use empty array
          setEvents([]);
          setStats({ total: 0, critical: 0, evidence: 0, response: 0, incident: 0, analysis: 0 });
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          setEvents(data);
          
          // Calculate stats
          const total = data.length;
          const critical = data.filter((e: any) => e.severity === 'Critical').length;
          const evidence = data.filter((e: any) => e.event_type === 'Evidence Uploaded' || e.event_type === 'Evidence Deleted').length;
          const incident = data.filter((e: any) => e.event_type === 'Incident Created' || e.event_type === 'Case Created').length;
          const analysis = data.filter((e: any) => e.event_type === 'AI Analysis Completed' || e.event_type === 'Metadata Extracted').length;
          const response = data.filter((e: any) => e.event_type === 'Report Generated' || e.event_type === 'Case Closed').length;
          
          setStats({ total, critical, evidence, response, incident, analysis });
        } else {
          setEvents([]);
          setStats({ total: 0, critical: 0, evidence: 0, response: 0, incident: 0, analysis: 0 });
        }
      } catch (err) {
        console.error('Error loading events:', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [selectedCaseId]);

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

  // Filter events
  useEffect(() => {
    let result = events;

    if (selectedFilter !== "all") {
      result = result.filter(event => {
        if (selectedFilter === "incident") return event.event_type === 'Incident Created' || event.event_type === 'Case Created';
        if (selectedFilter === "evidence") return event.event_type === 'Evidence Uploaded' || event.event_type === 'Evidence Deleted';
        if (selectedFilter === "analysis") return event.event_type === 'AI Analysis Completed' || event.event_type === 'Metadata Extracted';
        if (selectedFilter === "response") return event.event_type === 'Report Generated' || event.event_type === 'Case Closed';
        return true;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(event =>
        event.title?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.event_type?.toLowerCase().includes(term)
      );
    }

    setFilteredEvents(result);
  }, [selectedFilter, searchTerm, events]);

  const getTypeColor = (eventType: string) => {
    if (eventType?.includes('Case') || eventType?.includes('Incident')) {
      return { bg: "bg-red-500/20", border: "border-red-500/30", text: "text-red-400", dot: "bg-red-500" };
    }
    if (eventType?.includes('Evidence')) {
      return { bg: "bg-yellow-500/20", border: "border-yellow-500/30", text: "text-yellow-400", dot: "bg-yellow-500" };
    }
    if (eventType?.includes('AI') || eventType?.includes('Metadata')) {
      return { bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-400", dot: "bg-purple-500" };
    }
    if (eventType?.includes('Report')) {
      return { bg: "bg-green-500/20", border: "border-green-500/30", text: "text-green-400", dot: "bg-green-500" };
    }
    return { bg: "bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-500" };
  };

  const getTypeIcon = (eventType: string) => {
    if (eventType?.includes('Case')) return "📁";
    if (eventType?.includes('Evidence')) return "📄";
    if (eventType?.includes('AI')) return "🤖";
    if (eventType?.includes('Report')) return "📊";
    if (eventType?.includes('Incident')) return "🚨";
    if (eventType?.includes('Metadata')) return "🏷️";
    return "📌";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const currentCase = cases.find(c => c.id === selectedCaseId);

  // Group events by date
  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = event.event_time?.split('T')[0] || event.created_at?.split('T')[0] || 'Unknown';
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, TimelineEvent[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading timeline...</p>
        </div>
      </div>
    );
  }

  // If no events, show "No events found" message
  if (events.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-[#0B1220]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-12 text-center">
            <div className="text-6xl mb-4">⏱️</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Timeline Events</h2>
            <p className="text-gray-400">No timeline events found for this case.</p>
            <p className="text-sm text-gray-500 mt-1">Events will appear when evidence is uploaded or analysis is performed.</p>
          </div>
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
            <Link href="/timeline" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Timeline</Link>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Investigation Timeline</h1>
            <p className="text-gray-400">Complete chronological reconstruction of investigation events</p>
          </div>
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

        {/* Stats Summary - show only if there are events */}
        {stats.total > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Critical</p>
              <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
            </div>
            <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Evidence</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.evidence}</p>
            </div>
            <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Response</p>
              <p className="text-2xl font-bold text-blue-400">{stats.response}</p>
            </div>
            <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Incident</p>
              <p className="text-2xl font-bold text-red-400">{stats.incident}</p>
            </div>
            <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Analysis</p>
              <p className="text-2xl font-bold text-purple-400">{stats.analysis}</p>
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
                placeholder="Search events..."
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
              <option value="all">All Events</option>
              <option value="incident">Security Incidents</option>
              <option value="evidence">Evidence</option>
              <option value="analysis">Analysis</option>
              <option value="response">Response</option>
            </select>
          </div>
        </div>

        {/* Timeline Events */}
        <div className="space-y-8">
          {Object.keys(groupedEvents).length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400">No events found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <div key={date}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-2 h-6 bg-[#3B82F6] rounded-full"></div>
                  <h2 className="text-lg font-semibold text-white">
                    {date === 'Unknown' ? 'Unknown Date' : new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h2>
                  <span className="text-sm text-gray-500">({dateEvents.length} events)</span>
                </div>

                <div className="space-y-4">
                  {dateEvents.map((event, index) => {
                    const colors = getTypeColor(event.event_type);
                    return (
                      <div key={event.id} className="flex items-start space-x-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${colors.dot} border-2 border-[#0B1220]`}></div>
                          {index < dateEvents.length - 1 && (
                            <div className="w-0.5 h-full bg-[#1E293B]"></div>
                          )}
                        </div>

                        <div className={`flex-1 p-4 rounded-xl border-l-4 ${colors.border} ${colors.bg} hover:bg-[#1E293B]/30 transition-all`}>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{getTypeIcon(event.event_type)}</span>
                              <div>
                                <h3 className="text-sm font-semibold text-white">{event.title}</h3>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                  <span className={`text-xs ${colors.text}`}>
                                    {event.event_type}
                                  </span>
                                  <span className="text-xs text-gray-500">•</span>
                                  <span className={`text-xs ${event.severity === 'Critical' ? 'text-red-400' : event.severity === 'High' ? 'text-orange-400' : event.severity === 'Medium' ? 'text-yellow-400' : 'text-blue-400'}`}>
                                    {event.severity}
                                  </span>
                                  <span className="text-xs text-gray-500">•</span>
                                  <span className="text-xs text-gray-500">{event.source || 'System'}</span>
                                  {event.case_id && (
                                    <>
                                      <span className="text-xs text-gray-500">•</span>
                                      <Link href={`/cases/${event.case_id}`} className="text-xs text-[#3B82F6] hover:text-[#60A5FA]">
                                        {event.case_id}
                                      </Link>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-xs text-gray-500">{formatDate(event.event_time || event.created_at)}</span>
                            </div>
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-400 mt-2 leading-relaxed">{event.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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
                  <p className="text-sm font-medium text-white">{caseItem.id} - {caseItem.title}</p>
                  <p className="text-xs text-gray-500">Status: {caseItem.status} • Priority: {caseItem.priority}</p>
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
    </div>
  );
}

// ============================================================
// NAVBAR COMPONENT
// ============================================================

function Navbar() {
  return (
    <nav className="bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1E293B] px-6 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <PremiumLogo size="md" variant="white" />
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          <Link href="/timeline" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Timeline</Link>
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
  );
}