"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PremiumLogo from "../components/ui/PremiumLogo";
import { supabase } from "../lib/supabase";

interface Case {
  id: string;
  case_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  case_type: string;
  created_date: string;
  evidence_count: number;
  created_at: string;
}

export default function CasesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [casesPerPage] = useState(5);
  const [mounted, setMounted] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  // New Case Form State
  const [newCaseState, setNewCaseState] = useState({
    title: "",
    description: "",
    priority: "Medium",
    status: "Open",
    case_id: "",
  });

  // Edit Case Form State
  const [editCaseState, setEditCaseState] = useState({
    title: "",
    description: "",
    priority: "Medium",
    status: "Open",
  });

  // Load cases from Supabase
  useEffect(() => {
    setMounted(true);
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      
      // Get all cases
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .order('created_date', { ascending: false });

      if (casesError) {
        console.error('Error loading cases:', casesError);
        return;
      }

      // Get evidence counts for each case
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence')
        .select('case_id');

      if (evidenceError) {
        console.error('Error loading evidence:', evidenceError);
      }

      // Create a map of case_id -> evidence count
      const evidenceMap: Record<string, number> = {};
      evidenceData?.forEach((item: any) => {
        evidenceMap[item.case_id] = (evidenceMap[item.case_id] || 0) + 1;
      });

      // Combine cases with evidence counts
      const casesWithEvidence = casesData?.map((caseItem: any) => ({
        ...caseItem,
        evidence_count: evidenceMap[caseItem.case_id] || 0,
        // For compatibility with existing UI
        id: caseItem.case_id,
        date: caseItem.created_date || new Date(caseItem.created_at).toLocaleDateString(),
        evidence: evidenceMap[caseItem.case_id] || 0,
      })) || [];

      setCases(casesWithEvidence);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter cases
  const filteredCases = cases.filter((caseItem) => {
    const matchesSearch =
      caseItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.case_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "All" || caseItem.status === selectedStatus;
    const matchesPriority =
      selectedPriority === "All" || caseItem.priority === selectedPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCases.length / casesPerPage);
  const indexOfLastCase = currentPage * casesPerPage;
  const indexOfFirstCase = indexOfLastCase - casesPerPage;
  const currentCases = filteredCases.slice(indexOfFirstCase, indexOfLastCase);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleFilterChange = (setter: any, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

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

  // CREATE Case
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get the current user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, organization_id')
        .limit(1);

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        alert('Failed to get user profile. Please make sure you are logged in.');
        return;
      }

      if (!profileData || profileData.length === 0) {
        alert('No user profile found. Please make sure you are logged in.');
        return;
      }

      const profile = profileData[0];
      
      // Generate case_id
      const caseId = `CASE-${Date.now().toString().slice(-6)}`;
      
      const { data, error } = await supabase
        .from('cases')
        .insert([{
          case_id: caseId,
          title: newCaseState.title,
          description: newCaseState.description || null,
          priority: newCaseState.priority,
          status: newCaseState.status,
          organization_id: profile.organization_id,
          created_by: profile.id,
          created_date: new Date().toISOString().split('T')[0],
        }])
        .select();

      if (error) {
        console.error('Error creating case:', error);
        alert(`Failed to create case: ${error.message}`);
        return;
      }

      setShowNewCaseModal(false);
      setNewCaseState({ title: "", description: "", priority: "Medium", status: "Open", case_id: "" });
      loadCases(); // Reload the list
      setCurrentPage(1);
    } catch (error: any) {
      console.error('Error:', error);
      alert(`Failed to create case: ${error.message || 'Unknown error'}`);
    }
  };

  // VIEW Case - Navigate using case_id
  const handleViewCase = (caseItem: Case) => {
    router.push(`/cases/${caseItem.case_id}`);
  };

  // EDIT Case
  const handleEditClick = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setEditCaseState({
      title: caseItem.title || '',
      description: caseItem.description || '',
      priority: caseItem.priority || 'Medium',
      status: caseItem.status || 'Open',
    });
    setShowEditModal(true);
  };

  // UPDATE Case
  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    try {
      const { error } = await supabase
        .from('cases')
        .update({
          title: editCaseState.title,
          description: editCaseState.description,
          priority: editCaseState.priority,
          status: editCaseState.status,
        })
        .eq('case_id', selectedCase.case_id);

      if (error) {
        console.error('Error updating case:', error);
        alert('Failed to update case. Please try again.');
        return;
      }

      setShowEditModal(false);
      setSelectedCase(null);
      loadCases(); // Reload the list
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update case. Please try again.');
    }
  };

  // DELETE Case
  const handleDeleteClick = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCase) return;

    try {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('case_id', selectedCase.case_id);

      if (error) {
        console.error('Error deleting case:', error);
        alert('Failed to delete case. Please try again.');
        return;
      }

      setShowDeleteModal(false);
      setSelectedCase(null);
      loadCases(); // Reload the list
      
      if (currentCases.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete case. Please try again.');
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading cases...</p>
        </div>
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
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Cases</h1>
            <p className="text-gray-400">Manage your investigation cases</p>
          </div>
          <button
            onClick={() => setShowNewCaseModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Case</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => handleFilterChange(setSelectedStatus, e.target.value)}
              className="px-4 py-2.5 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => handleFilterChange(setSelectedPriority, e.target.value)}
              className="px-4 py-2.5 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
            >
              <option value="All">All Priority</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Cases Table */}
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0B1220] border-b border-[#1E293B]">
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Case ID</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Evidence</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500">No cases found</p>
                        <p className="text-sm text-gray-600">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentCases.map((caseItem) => (
                    <tr key={caseItem.id} className="border-b border-[#1E293B] hover:bg-[#0B1220]/50 transition-colors">
                      <td className="py-3 px-6">
                        <span className="text-sm font-medium text-[#3B82F6]">{caseItem.case_id}</span>
                      </td>
                      <td className="py-3 px-6">
                        <div>
                          <p className="text-sm font-medium text-white">{caseItem.title}</p>
                          <p className="text-xs text-gray-500">{caseItem.description}</p>
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${getPriorityColor(caseItem.priority)}`}>
                          {caseItem.priority}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${getStatusDot(caseItem.status)}`}></span>
                          <span className={`text-xs px-2.5 py-1 rounded-full ${getStatusColor(caseItem.status)}`}>
                            {caseItem.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-400">{caseItem.evidence_count || 0} files</td>
                      <td className="py-3 px-6 text-sm text-gray-500">{caseItem.created_date}</td>
                      <td className="py-3 px-6">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleViewCase(caseItem)}
                            className="p-1.5 text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-lg transition-colors"
                            title="View Case"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditClick(caseItem)}
                            className="p-1.5 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"
                            title="Edit Case"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(caseItem)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Case"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredCases.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#1E293B] bg-[#0B1220]/30">
              <p className="text-sm text-gray-500">
                Showing {indexOfFirstCase + 1} - {Math.min(indexOfLastCase, filteredCases.length)} of {filteredCases.length} cases
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      currentPage === number
                        ? "bg-[#3B82F6] text-white"
                        : "text-gray-500 hover:text-white hover:bg-[#1E293B]"
                    }`}
                  >
                    {number}
                  </button>
                ))}
                {totalPages > 5 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <button
                      onClick={() => paginate(totalPages)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        currentPage === totalPages
                          ? "bg-[#3B82F6] text-white"
                          : "text-gray-500 hover:text-white hover:bg-[#1E293B]"
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== NEW CASE MODAL ========== */}
      {showNewCaseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Case</h2>
              <button
                onClick={() => setShowNewCaseModal(false)}
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
                  value={newCaseState.title}
                  onChange={(e) => setNewCaseState({ ...newCaseState, title: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  placeholder="Enter case title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newCaseState.description}
                  onChange={(e) => setNewCaseState({ ...newCaseState, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all min-h-[100px]"
                  placeholder="Enter case description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                  <select
                    value={newCaseState.priority}
                    onChange={(e) => setNewCaseState({ ...newCaseState, priority: e.target.value })}
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
                    value={newCaseState.status}
                    onChange={(e) => setNewCaseState({ ...newCaseState, status: e.target.value })}
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
                <button
                  type="button"
                  onClick={() => setShowNewCaseModal(false)}
                  className="px-4 py-2.5 bg-[#0B1220] border border-[#2A3A4A] text-gray-400 font-medium rounded-xl hover:bg-[#1A2332] transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== EDIT CASE MODAL ========== */}
      {showEditModal && selectedCase && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Edit Case</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-500 hover:text-white hover:bg-[#1E293B] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateCase} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Case Title *</label>
                <input
                  type="text"
                  value={editCaseState.title}
                  onChange={(e) => setEditCaseState({ ...editCaseState, title: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  placeholder="Enter case title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={editCaseState.description}
                  onChange={(e) => setEditCaseState({ ...editCaseState, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all min-h-[100px]"
                  placeholder="Enter case description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                  <select
                    value={editCaseState.priority}
                    onChange={(e) => setEditCaseState({ ...editCaseState, priority: e.target.value })}
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
                    value={editCaseState.status}
                    onChange={(e) => setEditCaseState({ ...editCaseState, status: e.target.value })}
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
                  Update Case
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 bg-[#0B1220] border border-[#2A3A4A] text-gray-400 font-medium rounded-xl hover:bg-[#1A2332] transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== DELETE CONFIRMATION MODAL ========== */}
      {showDeleteModal && selectedCase && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2332] rounded-2xl border border-[#1E293B] w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Delete Case</h2>
              <p className="text-gray-400 mt-2">
                Are you sure you want to delete <span className="text-white font-medium">{selectedCase.case_id}</span>?
                <br />
                <span className="text-sm text-gray-500">This action cannot be undone.</span>
              </p>
              <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-[#1E293B]">
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all"
                >
                  Delete Case
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-[#0B1220] border border-[#2A3A4A] text-gray-400 font-medium rounded-xl hover:bg-[#1A2332] transition-all"
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