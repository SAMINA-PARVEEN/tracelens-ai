// ============================================================
// TIMELINE SERVICE - Complete Timeline Management
// ============================================================

export interface TimelineEvent {
  id: string;
  caseId?: string;
  evidenceId?: string;
  userId?: string;
  userName?: string;
  type: string;
  category: string;
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  date: string;
  time: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// DEMO DATA
// ============================================================

let timelineEvents: TimelineEvent[] = [
  {
    id: "TL-001",
    caseId: "C-001",
    type: "case",
    category: "investigation",
    title: "Case Created",
    description: "Case C-001 was created: Email Phishing Investigation",
    importance: "high",
    date: "2026-07-18",
    time: "09:00:00",
    createdAt: "2026-07-18T09:00:00Z",
    updatedAt: "2026-07-18T09:00:00Z",
  },
  {
    id: "TL-002",
    caseId: "C-001",
    type: "evidence",
    category: "investigation",
    title: "Evidence Uploaded",
    description: "Email file uploaded: phishing_email.eml",
    importance: "medium",
    date: "2026-07-18",
    time: "09:30:00",
    createdAt: "2026-07-18T09:30:00Z",
    updatedAt: "2026-07-18T09:30:00Z",
  },
  {
    id: "TL-003",
    caseId: "C-001",
    type: "analysis",
    category: "analysis",
    title: "AI Analysis Completed",
    description: "AI analysis completed for phishing_email.eml",
    importance: "high",
    date: "2026-07-18",
    time: "10:00:00",
    createdAt: "2026-07-18T10:00:00Z",
    updatedAt: "2026-07-18T10:00:00Z",
  },
  {
    id: "TL-004",
    caseId: "C-001",
    type: "response",
    category: "response",
    title: "Containment Action",
    description: "Phishing domain blocked and passwords reset",
    importance: "critical",
    date: "2026-07-18",
    time: "10:30:00",
    createdAt: "2026-07-18T10:30:00Z",
    updatedAt: "2026-07-18T10:30:00Z",
  },
  {
    id: "TL-005",
    caseId: "C-001",
    type: "report",
    category: "reporting",
    title: "Report Generated",
    description: "Investigation report R-001 generated",
    importance: "medium",
    date: "2026-07-18",
    time: "14:00:00",
    createdAt: "2026-07-18T14:00:00Z",
    updatedAt: "2026-07-18T14:00:00Z",
  },
  {
    id: "TL-006",
    caseId: "C-002",
    type: "case",
    category: "investigation",
    title: "Case Created",
    description: "Case C-002 was created: Data Breach Analysis",
    importance: "high",
    date: "2026-07-16",
    time: "10:00:00",
    createdAt: "2026-07-16T10:00:00Z",
    updatedAt: "2026-07-16T10:00:00Z",
  },
  {
    id: "TL-007",
    caseId: "C-002",
    type: "evidence",
    category: "investigation",
    title: "Evidence Uploaded",
    description: "Data file uploaded: breach_data.csv",
    importance: "medium",
    date: "2026-07-16",
    time: "10:30:00",
    createdAt: "2026-07-16T10:30:00Z",
    updatedAt: "2026-07-16T10:30:00Z",
  },
  {
    id: "TL-008",
    caseId: "C-003",
    type: "case",
    category: "investigation",
    title: "Case Created",
    description: "Case C-003 was created: Malware Incident Response",
    importance: "high",
    date: "2026-07-14",
    time: "09:30:00",
    createdAt: "2026-07-14T09:30:00Z",
    updatedAt: "2026-07-14T09:30:00Z",
  },
  {
    id: "TL-009",
    caseId: "C-003",
    type: "incident",
    category: "incident",
    title: "Security Incident Detected",
    description: "Ransomware infection detected on finance server",
    importance: "critical",
    date: "2026-07-14",
    time: "09:45:00",
    createdAt: "2026-07-14T09:45:00Z",
    updatedAt: "2026-07-14T09:45:00Z",
  },
  {
    id: "TL-010",
    caseId: "C-003",
    type: "response",
    category: "response",
    title: "Containment Action",
    description: "Finance server isolated from network",
    importance: "critical",
    date: "2026-07-14",
    time: "10:00:00",
    createdAt: "2026-07-14T10:00:00Z",
    updatedAt: "2026-07-14T10:00:00Z",
  },
  {
    id: "TL-011",
    caseId: "C-003",
    type: "response",
    category: "response",
    title: "Eradication",
    description: "Ransomware removed from affected systems",
    importance: "high",
    date: "2026-07-14",
    time: "14:00:00",
    createdAt: "2026-07-14T14:00:00Z",
    updatedAt: "2026-07-14T14:00:00Z",
  },
  {
    id: "TL-012",
    caseId: "C-003",
    type: "milestone",
    category: "investigation",
    title: "Case Milestone",
    description: "Incident contained and resolved",
    importance: "high",
    date: "2026-07-15",
    time: "10:00:00",
    createdAt: "2026-07-15T10:00:00Z",
    updatedAt: "2026-07-15T10:00:00Z",
  },
];

let eventCounter = 13;

// ============================================================
// GET FUNCTIONS
// ============================================================

export function getTimelineEvents(caseId?: string): TimelineEvent[] {
  if (caseId) {
    return timelineEvents.filter(event => event.caseId === caseId);
  }
  return timelineEvents;
}

export function getTimelineEventById(id: string): TimelineEvent | null {
  return timelineEvents.find(event => event.id === id) || null;
}

export function getTimelineStats(caseId?: string) {
  const filtered = caseId ? timelineEvents.filter(e => e.caseId === caseId) : timelineEvents;
  
  return {
    total: filtered.length,
    critical: filtered.filter(e => e.importance === 'critical').length,
    evidence: filtered.filter(e => e.type === 'evidence').length,
    response: filtered.filter(e => e.type === 'response').length,
    incident: filtered.filter(e => e.type === 'incident').length,
    analysis: filtered.filter(e => e.type === 'analysis').length,
  };
}

// ============================================================
// CREATE FUNCTIONS
// ============================================================

export function createTimelineEvent(data: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>): TimelineEvent {
  const now = new Date().toISOString();
  const newEvent: TimelineEvent = {
    id: `TL-${String(eventCounter++).padStart(3, '0')}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  timelineEvents = [newEvent, ...timelineEvents];
  return newEvent;
}

// ============================================================
// UPDATE FUNCTIONS
// ============================================================

export function updateTimelineEvent(id: string, updates: Partial<TimelineEvent>): TimelineEvent | null {
  const index = timelineEvents.findIndex(event => event.id === id);
  if (index === -1) return null;
  
  timelineEvents[index] = {
    ...timelineEvents[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return timelineEvents[index];
}

// ============================================================
// DELETE FUNCTIONS
// ============================================================

export function deleteTimelineEvent(id: string): boolean {
  const initialLength = timelineEvents.length;
  timelineEvents = timelineEvents.filter(event => event.id !== id);
  return timelineEvents.length < initialLength;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getEventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    incident: 'bg-red-500/20 text-red-400 border-red-500/30',
    evidence: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    analysis: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    response: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    report: 'bg-green-500/20 text-green-400 border-green-500/30',
    case: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    review: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    milestone: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };
  return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

export function getEventTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    incident: '🚨',
    evidence: '📄',
    analysis: '🔍',
    response: '🛡️',
    report: '📊',
    case: '📁',
    review: '✅',
    milestone: '📍',
  };
  return icons[type] || '📌';
}

export function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    incident: 'Security Incident',
    evidence: 'Evidence',
    analysis: 'Analysis',
    response: 'Response',
    report: 'Report',
    case: 'Case Event',
    review: 'Review',
    milestone: 'Milestone',
  };
  return labels[type] || 'Event';
}

export const eventTypes = ['incident', 'evidence', 'analysis', 'response', 'report', 'case', 'review', 'milestone'];
export const eventImportances = ['low', 'medium', 'high', 'critical'];
export const eventCategories = ['incident', 'investigation', 'response', 'analysis', 'reporting'];