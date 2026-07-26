"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "../components/layout/MainLayout";
import { getCases, getEvidenceStats } from "@/services/database.service";
import { supabase } from "../lib/supabase";

export default function DashboardPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evidenceStats, setEvidenceStats] = useState({
    total: 0,
    verified: 0,
    modified: 0,
    corrupted: 0,
    unknown: 0,
    verificationRate: 0,
    pendingAnalysis: 0,
    integrityAlerts: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load cases from database
        const allCases = await getCases();
        
        // Get real evidence counts for each case
        const { data: evidenceData, error: evidenceError } = await supabase
          .from('evidence')
          .select('case_id');
        
        if (!evidenceError && evidenceData) {
          // Create a map of case_id -> evidence count
          const evidenceMap: Record<string, number> = {};
          evidenceData.forEach((item: any) => {
            evidenceMap[item.case_id] = (evidenceMap[item.case_id] || 0) + 1;
          });
          
          // Add evidence count to each case
          const casesWithEvidence = allCases.map((caseItem: any) => ({
            ...caseItem,
            evidence: evidenceMap[caseItem.case_id] || 0
          }));
          
          setCases(casesWithEvidence.slice(0, 5));
        } else {
          setCases(allCases.slice(0, 5));
        }
        
        // Load evidence stats from database
        const stats = await getEvidenceStats();
        setEvidenceStats(stats);
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const stats = [
    { 
      label: "Total Cases", 
      value: cases.length, 
      icon: "📁", 
      color: "bg-blue-500/10 text-blue-400",
      description: "All investigation cases"
    },
    { 
      label: "Evidence Files", 
      value: evidenceStats.total, 
      icon: "📄", 
      color: "bg-green-500/10 text-green-400",
      description: "Total uploaded evidence"
    },
    { 
      label: "Verified Evidence", 
      value: `${evidenceStats.verificationRate}%`, 
      icon: "✅", 
      color: "bg-emerald-500/10 text-emerald-400",
      description: `${evidenceStats.verified} of ${evidenceStats.total} verified`
    },
    { 
      label: "Integrity Alerts", 
      value: evidenceStats.integrityAlerts, 
      icon: "⚠️", 
      color: "bg-red-500/10 text-red-400",
      description: "Evidence with integrity issues"
    },
    { 
      label: "AI Analyses", 
      value: 89, 
      icon: "🤖", 
      color: "bg-purple-500/10 text-purple-400",
      description: "Completed AI analyses"
    },
    { 
      label: "Reports", 
      value: 18, 
      icon: "📊", 
      color: "bg-orange-500/10 text-orange-400",
      description: "Generated reports"
    },
  ];

  // Quick Actions
  const quickActions = [
    { name: "New Case", icon: "📁", href: "/cases", color: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" },
    { name: "Upload Evidence", icon: "📤", href: "/evidence", color: "bg-green-500/10 text-green-400 hover:bg-green-500/20" },
    { name: "Metadata", icon: "🏷️", href: "/metadata", color: "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20" },
    { name: "Log Analysis", icon: "📊", href: "/log-analysis", color: "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20" },
    { name: "Email Analysis", icon: "✉️", href: "/email-analysis", color: "bg-red-500/10 text-red-400 hover:bg-red-500/20" },
    { name: "OSINT", icon: "🔍", href: "/osint", color: "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20" },
    { name: "Timeline", icon: "⏱️", href: "/timeline", color: "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20" },
    { name: "Incident Response", icon: "🛡️", href: "/incident-response", color: "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" },
    { name: "Reports", icon: "📋", href: "/reports", color: "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" },
    { name: "Settings", icon: "⚙️", href: "/settings", color: "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "bg-blue-500/20 text-blue-400";
      case "In Progress": return "bg-yellow-500/20 text-yellow-400";
      case "Closed": return "bg-green-500/20 text-green-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-500/20 text-red-400";
      case "High": return "bg-orange-500/20 text-orange-400";
      case "Medium": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-blue-500/20 text-blue-400";
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Welcome back, Samina! Here's your investigation overview.</p>
        </div>

        {/* Stats Grid - 6 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-4 hover:border-[#3B82F6]/30 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{stat.description}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Integrity Status Bar */}
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Evidence Integrity Overview</h3>
              <p className="text-xs text-gray-500">Verification status of all evidence files</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-400">Verified ({evidenceStats.verified})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-xs text-gray-400">Modified ({evidenceStats.modified})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs text-gray-400">Corrupted ({evidenceStats.corrupted})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-xs text-gray-400">Unknown ({evidenceStats.unknown})</span>
              </div>
            </div>
          </div>
          <div className="w-full bg-[#0B1220] rounded-full h-3">
            <div 
              className="h-3 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-1000"
              style={{ width: `${evidenceStats.verificationRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">0%</span>
            <span className="text-xs text-gray-400">{evidenceStats.verificationRate}% Verified</span>
            <span className="text-xs text-gray-500">100%</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className={`flex items-center space-x-2 px-4 py-3 bg-[#1A2332] rounded-xl border border-[#1E293B] transition-all ${action.color}`}
              >
                <span className="text-lg">{action.icon}</span>
                <span className="text-sm font-medium">{action.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Cases */}
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B]">
          <div className="flex items-center justify-between p-6 border-b border-[#1E293B]">
            <h3 className="text-lg font-semibold text-white">Recent Cases</h3>
            <Link href="/cases" className="text-sm text-[#3B82F6] hover:text-[#60A5FA] font-medium">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1E293B] bg-[#0B1220]">
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Case ID</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Evidence</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((caseItem) => (
                  <tr key={caseItem.id} className="border-b border-[#1E293B] hover:bg-[#0B1220]/50 transition-colors">
                    <td className="py-3 px-6 text-sm font-medium text-[#3B82F6]">{caseItem.id}</td>
                    <td className="py-3 px-6 text-sm text-white">{caseItem.title}</td>
                    <td className="py-3 px-6">
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(caseItem.priority)}`}>
                        {caseItem.priority}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(caseItem.status)}`}>
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-400">{caseItem.evidence || 0} files</td>
                    <td className="py-3 px-6 text-sm text-gray-500">{caseItem.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}