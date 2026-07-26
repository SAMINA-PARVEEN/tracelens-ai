import { supabase } from "../../app/lib/supabase";

// ============================================================
// CASES
// ============================================================

export async function getCases() {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('No cases found');
      return [];
    }

    return data.map((caseItem: any) => ({
      id: caseItem.case_id || caseItem.id,
      title: caseItem.title || 'Untitled Case',
      priority: caseItem.priority || 'Medium',
      status: caseItem.status || 'Open',
      evidence: 0,
      date: caseItem.created_at ? new Date(caseItem.created_at).toLocaleDateString() : 'N/A',
      ...caseItem
    }));
  } catch (err) {
    console.error('Error in getCases:', err);
    return [];
  }
}

export async function getCaseStats() {
  try {
    const { count: total, error: totalError } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error getting total cases:', totalError);
      return { total: 0, active: 0, closed: 0 };
    }

    const { count: active, error: activeError } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .in('status', ['Open', 'In Progress', 'Under Review']);

    if (activeError) {
      console.error('Error getting active cases:', activeError);
    }

    const { count: closed, error: closedError } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Closed');

    if (closedError) {
      console.error('Error getting closed cases:', closedError);
    }

    return {
      total: total || 0,
      active: active || 0,
      closed: closed || 0
    };
  } catch (err) {
    console.error('Error in getCaseStats:', err);
    return { total: 0, active: 0, closed: 0 };
  }
}

// ============================================================
// EVIDENCE
// ============================================================

export async function getEvidenceStats() {
  try {
    const { data, error } = await supabase
      .from('evidence')
      .select('id, hash_sha256');

    if (error) {
      console.error('Error fetching evidence:', error);
      return {
        total: 0,
        verified: 0,
        modified: 0,
        corrupted: 0,
        unknown: 0,
        verificationRate: 0,
        pendingAnalysis: 0,
        integrityAlerts: 0,
      };
    }

    const total = data?.length || 0;
    const verified = data?.filter((e: any) => e.hash_sha256).length || 0;
    const modified = 0;
    const corrupted = 0;
    const unknown = total - verified;
    const verificationRate = total > 0 ? Math.round((verified / total) * 100) : 0;
    
    return {
      total,
      verified,
      modified,
      corrupted,
      unknown,
      verificationRate,
      pendingAnalysis: 12,
      integrityAlerts: modified + corrupted,
    };
  } catch (err) {
    console.error('Error in getEvidenceStats:', err);
    return {
      total: 0,
      verified: 0,
      modified: 0,
      corrupted: 0,
      unknown: 0,
      verificationRate: 0,
      pendingAnalysis: 0,
      integrityAlerts: 0,
    };
  }
}

export async function getEvidenceCount() {
  try {
    const { count, error } = await supabase
      .from('evidence')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error getting evidence count:', error);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.error('Error in getEvidenceCount:', err);
    return 0;
  }
}

// ============================================================
// REPORTS
// ============================================================

export async function getReportCount() {
  try {
    const { count, error } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error getting report count:', error);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.error('Error in getReportCount:', err);
    return 0;
  }
}

// ============================================================
// INCIDENTS
// ============================================================

export async function getIncidentCount() {
  try {
    const { count, error } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error getting incident count:', error);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.error('Error in getIncidentCount:', err);
    return 0;
  }
}

// ============================================================
// AI ANALYSIS
// ============================================================

export async function getAIAnalysisCount() {
  try {
    const { count, error } = await supabase
      .from('ai_analysis')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error getting AI analysis count:', error);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.error('Error in getAIAnalysisCount:', err);
    return 0;
  }
}

// ============================================================
// DASHBOARD STATS
// ============================================================

export async function getDashboardStats() {
  try {
    const [
      caseStats,
      evidenceStats,
      reportCount,
      incidentCount,
      aiCount
    ] = await Promise.all([
      getCaseStats(),
      getEvidenceStats(),
      getReportCount(),
      getIncidentCount(),
      getAIAnalysisCount()
    ]);

    return {
      cases: caseStats,
      evidence: evidenceStats,
      reports: reportCount,
      incidents: incidentCount,
      aiAnalyses: aiCount
    };
  } catch (err) {
    console.error('Error in getDashboardStats:', err);
    return {
      cases: { total: 0, active: 0, closed: 0 },
      evidence: { total: 0, verified: 0, modified: 0, corrupted: 0, unknown: 0, verificationRate: 0, pendingAnalysis: 0, integrityAlerts: 0 },
      reports: 0,
      incidents: 0,
      aiAnalyses: 0
    };
  }
}