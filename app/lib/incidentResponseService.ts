// ============================================================
// INCIDENT RESPONSE SERVICE - NIST Framework Based
// ============================================================

export interface Incident {
  id: string;
  caseId?: string;
  title: string;
  description: string;
  type: 'phishing' | 'malware' | 'ransomware' | 'data_breach' | 'unauthorized_access' | 'insider_threat' | 'web_attack' | 'ddos' | 'credential_theft' | 'lost_device' | 'email_compromise' | 'unknown';
  severity: 'informational' | 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'eradicated' | 'recovered' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface IncidentPlan {
  id: string;
  incidentId: string;
  title: string;
  summary: string;
  phases: {
    preparation: string[];
    detection_analysis: string[];
    containment: string[];
    eradication: string[];
    recovery: string[];
    lessons_learned: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface IncidentAction {
  id: string;
  incidentId: string;
  phase: 'preparation' | 'detection_analysis' | 'containment' | 'eradication' | 'recovery' | 'lessons_learned';
  action: string;
  description: string;
  performedBy: string;
  timestamp: string;
  notes?: string;
}

export interface IncidentTask {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  createdAt: string;
  completedAt?: string;
}

export interface IncidentEvidence {
  id: string;
  incidentId: string;
  evidenceId: string;
  name: string;
  type: string;
  linkedAt: string;
}

export interface CreateIncidentDTO {
  caseId?: string;
  title: string;
  description: string;
  type: Incident['type'];
  severity: Incident['severity'];
  priority: Incident['priority'];
  assignedTo: string;
  reportedBy: string;
}

// ============================================================
// DEMO INCIDENTS
// ============================================================

const demoIncidents: Incident[] = [
  {
    id: "INC-001",
    caseId: "C-001",
    title: "Phishing Campaign Targeting Employees",
    description: "Multiple employees reported receiving suspicious emails impersonating the IT department. The emails contain links to credential harvesting pages.",
    type: "phishing",
    severity: "high",
    status: "investigating",
    priority: "high",
    assignedTo: "Samina Parveen",
    reportedBy: "IT Helpdesk",
    createdAt: "2026-07-18T09:00:00Z",
    updatedAt: "2026-07-18T11:00:00Z",
  },
  {
    id: "INC-002",
    caseId: "C-003",
    title: "Ransomware Infection on Finance Server",
    description: "Finance server detected with ransomware. Files are being encrypted. Lateral movement observed to backup server.",
    type: "ransomware",
    severity: "critical",
    status: "contained",
    priority: "critical",
    assignedTo: "Samina Parveen",
    reportedBy: "SOC Alert",
    createdAt: "2026-07-14T09:30:00Z",
    updatedAt: "2026-07-15T10:00:00Z",
  },
  {
    id: "INC-003",
    caseId: "C-002",
    title: "Data Breach - Customer PII Exposed",
    description: "Database containing customer PII was accessed by unauthorized IP addresses. Investigation ongoing to determine scope.",
    type: "data_breach",
    severity: "critical",
    status: "investigating",
    priority: "critical",
    assignedTo: "Samina Parveen",
    reportedBy: "Security Monitoring",
    createdAt: "2026-07-16T10:00:00Z",
    updatedAt: "2026-07-16T15:00:00Z",
  },
];

// ============================================================
// DEMO PLANS
// ============================================================

const demoPlans: IncidentPlan[] = [
  {
    id: "PLAN-001",
    incidentId: "INC-001",
    title: "Phishing Incident Response Plan",
    summary: "Comprehensive plan for responding to phishing incidents targeting employees.",
    phases: {
      preparation: [
        "Define incident response team roles",
        "Establish communication channels",
        "Deploy email security controls",
        "Conduct phishing awareness training",
        "Regular backup of critical data"
      ],
      detection_analysis: [
        "Monitor email security alerts",
        "Analyze reported phishing emails",
        "Review email headers and metadata",
        "Check for malicious links and attachments",
        "Identify affected users"
      ],
      containment: [
        "Block sender domain at email gateway",
        "Quarantine malicious emails",
        "Force password reset for affected users",
        "Disable compromised accounts",
        "Review email forwarding rules"
      ],
      eradication: [
        "Remove malicious emails from mailboxes",
        "Delete suspicious forwarding rules",
        "Scan endpoints for malware",
        "Remove any unauthorized access"
      ],
      recovery: [
        "Restore from clean backups if needed",
        "Re-enable affected accounts",
        "Implement additional email filtering",
        "Conduct security awareness training"
      ],
      lessons_learned: [
        "Implement MFA for all users",
        "Enhance email filtering rules",
        "Improve employee security training",
        "Develop phishing simulation program"
      ]
    },
    createdAt: "2026-07-18T09:10:00Z",
    updatedAt: "2026-07-18T11:00:00Z"
  },
  {
    id: "PLAN-002",
    incidentId: "INC-002",
    title: "Ransomware Incident Response Plan",
    summary: "Emergency plan for responding to ransomware attacks.",
    phases: {
      preparation: [
        "Maintain offline backups",
        "Deploy EDR solution",
        "Define network segmentation",
        "Establish incident response team",
        "Regular backup verification"
      ],
      detection_analysis: [
        "Monitor EDR alerts",
        "Analyze ransom note",
        "Identify affected systems",
        "Check for lateral movement",
        "Review backup integrity"
      ],
      containment: [
        "Isolate infected systems immediately",
        "Disable network shares",
        "Block ransomware domains",
        "Reset compromised credentials",
        "Enable network segmentation"
      ],
      eradication: [
        "Remove ransomware binaries",
        "Delete scheduled tasks",
        "Remove persistence mechanisms",
        "Patch vulnerabilities"
      ],
      recovery: [
        "Restore encrypted files from backups",
        "Rebuild compromised systems",
        "Apply latest security patches",
        "Reconnect systems after verification"
      ],
      lessons_learned: [
        "Implement endpoint protection",
        "Regular backup verification",
        "Employee security training",
        "Network segmentation improvement"
      ]
    },
    createdAt: "2026-07-14T09:35:00Z",
    updatedAt: "2026-07-15T10:00:00Z"
  },
  {
    id: "PLAN-003",
    incidentId: "INC-003",
    title: "Data Breach Response Plan",
    summary: "Comprehensive plan for responding to data breaches involving customer PII.",
    phases: {
      preparation: [
        "Define data classification policy",
        "Establish breach notification process",
        "Engage legal counsel",
        "Prepare PR response templates",
        "Implement data encryption"
      ],
      detection_analysis: [
        "Monitor database activity logs",
        "Analyze access patterns",
        "Identify compromised data",
        "Determine breach scope",
        "Check for data exfiltration"
      ],
      containment: [
        "Isolate affected database servers",
        "Block suspicious IP addresses",
        "Reset database credentials",
        "Enable additional logging",
        "Review firewall rules"
      ],
      eradication: [
        "Remove unauthorized access",
        "Patch database vulnerabilities",
        "Close unnecessary ports",
        "Deploy additional controls"
      ],
      recovery: [
        "Restore database from clean backup",
        "Implement database encryption",
        "Enhance access controls",
        "Monitor for further activity"
      ],
      lessons_learned: [
        "Implement database monitoring",
        "Regular security audits",
        "Data encryption strategy",
        "Improved access control policies"
      ]
    },
    createdAt: "2026-07-16T10:15:00Z",
    updatedAt: "2026-07-16T15:00:00Z"
  }
];

// ============================================================
// DEMO ACTIONS
// ============================================================

const demoActions: IncidentAction[] = [
  {
    id: "ACT-001",
    incidentId: "INC-001",
    phase: "detection_analysis",
    action: "Email Analysis",
    description: "Analyzed phishing email headers and content. Identified spoofed sender domain.",
    performedBy: "Samina Parveen",
    timestamp: "2026-07-18T09:30:00Z",
    notes: "Domain: security@fake-company.com. Reply-To: verify@phishing-site.com",
  },
  {
    id: "ACT-002",
    incidentId: "INC-001",
    phase: "containment",
    action: "Blocked Domain",
    description: "Blocked phishing domain at email gateway and firewall.",
    performedBy: "Samina Parveen",
    timestamp: "2026-07-18T10:00:00Z",
    notes: "Domain: phishing-site.com",
  },
];

// ============================================================
// DEMO TASKS
// ============================================================

const demoTasks: IncidentTask[] = [
  {
    id: "TASK-001",
    incidentId: "INC-001",
    title: "Investigate phishing email",
    description: "Perform deep analysis of phishing email headers and determine if any users clicked the link.",
    assignedTo: "Samina Parveen",
    status: "completed",
    dueDate: "2026-07-18",
    createdAt: "2026-07-18T09:15:00Z",
    completedAt: "2026-07-18T10:45:00Z",
  },
  {
    id: "TASK-002",
    incidentId: "INC-001",
    title: "Review access logs",
    description: "Check if any compromised accounts were used to access sensitive data.",
    assignedTo: "Samina Parveen",
    status: "in_progress",
    dueDate: "2026-07-19",
    createdAt: "2026-07-18T11:00:00Z",
  },
];

// ============================================================
// DEMO EVIDENCE
// ============================================================

const demoIncidentEvidence: IncidentEvidence[] = [
  {
    id: "IE-001",
    incidentId: "INC-001",
    evidenceId: "E-001",
    name: "phishing_email.eml",
    type: "Email",
    linkedAt: "2026-07-18T09:30:00Z",
  },
  {
    id: "IE-002",
    incidentId: "INC-001",
    evidenceId: "E-002",
    name: "screenshot.png",
    type: "Image",
    linkedAt: "2026-07-18T09:45:00Z",
  },
];

// ============================================================
// DATA STORE
// ============================================================

let incidents: Incident[] = [...demoIncidents];
let plans: IncidentPlan[] = [...demoPlans];
let actions: IncidentAction[] = [...demoActions];
let tasks: IncidentTask[] = [...demoTasks];
let incidentEvidence: IncidentEvidence[] = [...demoIncidentEvidence];

let incidentCounter = 4;
let planCounter = 4;
let actionCounter = 3;
let taskCounter = 3;

// ============================================================
// SERVICE FUNCTIONS
// ============================================================

// ----- INCIDENT FUNCTIONS -----
export function getIncidents(caseId?: string): Incident[] {
  if (caseId) {
    return incidents.filter(i => i.caseId === caseId);
  }
  return incidents;
}

export function getIncidentById(id: string): Incident | null {
  return incidents.find(i => i.id === id) || null;
}

export function createIncident(data: CreateIncidentDTO): Incident {
  const newIncident: Incident = {
    id: `INC-${String(incidentCounter++).padStart(3, '0')}`,
    caseId: data.caseId,
    title: data.title,
    description: data.description,
    type: data.type,
    severity: data.severity,
    status: 'open',
    priority: data.priority,
    assignedTo: data.assignedTo,
    reportedBy: data.reportedBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  incidents = [newIncident, ...incidents];
  return newIncident;
}

export function getIncidentStats() {
  return {
    total: incidents.length,
    open: incidents.filter(i => i.status === 'open').length,
    investigating: incidents.filter(i => i.status === 'investigating').length,
    contained: incidents.filter(i => i.status === 'contained').length,
    closed: incidents.filter(i => i.status === 'closed').length,
    critical: incidents.filter(i => i.severity === 'critical').length,
    high: incidents.filter(i => i.severity === 'high').length,
  };
}

// ----- PLAN FUNCTIONS -----
export function getIncidentPlan(incidentId: string): IncidentPlan | null {
  return plans.find(p => p.incidentId === incidentId) || null;
}

export function getIncidentPlanById(id: string): IncidentPlan | null {
  return plans.find(p => p.id === id) || null;
}

export function createIncidentPlan(incidentId: string, title: string, summary: string): IncidentPlan {
  const newPlan: IncidentPlan = {
    id: `PLAN-${String(planCounter++).padStart(3, '0')}`,
    incidentId,
    title,
    summary,
    phases: {
      preparation: [],
      detection_analysis: [],
      containment: [],
      eradication: [],
      recovery: [],
      lessons_learned: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  plans = [...plans, newPlan];
  return newPlan;
}

export function updatePlanPhase(
  planId: string, 
  phase: keyof IncidentPlan['phases'], 
  items: string[]
): IncidentPlan | null {
  const index = plans.findIndex(p => p.id === planId);
  if (index === -1) return null;
  plans[index].phases[phase] = items;
  plans[index].updatedAt = new Date().toISOString();
  return plans[index];
}

export function generateAIPlan(incident: Incident): IncidentPlan {
  // AI-generated plan based on incident type
  const planTemplates: Record<string, { title: string; phases: IncidentPlan['phases'] }> = {
    phishing: {
      title: `${incident.type.toUpperCase()} Incident Response Plan`,
      phases: {
        preparation: [
          "Define incident response team roles",
          "Establish communication channels",
          "Deploy email security controls",
          "Conduct phishing awareness training",
          "Regular backup of critical data"
        ],
        detection_analysis: [
          "Monitor email security alerts",
          "Analyze reported phishing emails",
          "Review email headers and metadata",
          "Check for malicious links and attachments",
          "Identify affected users"
        ],
        containment: [
          "Block sender domain at email gateway",
          "Quarantine malicious emails",
          "Force password reset for affected users",
          "Disable compromised accounts",
          "Review email forwarding rules"
        ],
        eradication: [
          "Remove malicious emails from mailboxes",
          "Delete suspicious forwarding rules",
          "Scan endpoints for malware",
          "Remove any unauthorized access"
        ],
        recovery: [
          "Restore from clean backups if needed",
          "Re-enable affected accounts",
          "Implement additional email filtering",
          "Conduct security awareness training"
        ],
        lessons_learned: [
          "Implement MFA for all users",
          "Enhance email filtering rules",
          "Improve employee security training",
          "Develop phishing simulation program"
        ]
      }
    },
    ransomware: {
      title: `${incident.type.toUpperCase()} Incident Response Plan`,
      phases: {
        preparation: [
          "Maintain offline backups",
          "Deploy EDR solution",
          "Define network segmentation",
          "Establish incident response team",
          "Regular backup verification"
        ],
        detection_analysis: [
          "Monitor EDR alerts",
          "Analyze ransom note",
          "Identify affected systems",
          "Check for lateral movement",
          "Review backup integrity"
        ],
        containment: [
          "Isolate infected systems immediately",
          "Disable network shares",
          "Block ransomware domains",
          "Reset compromised credentials",
          "Enable network segmentation"
        ],
        eradication: [
          "Remove ransomware binaries",
          "Delete scheduled tasks",
          "Remove persistence mechanisms",
          "Patch vulnerabilities"
        ],
        recovery: [
          "Restore encrypted files from backups",
          "Rebuild compromised systems",
          "Apply latest security patches",
          "Reconnect systems after verification"
        ],
        lessons_learned: [
          "Implement endpoint protection",
          "Regular backup verification",
          "Employee security training",
          "Network segmentation improvement"
        ]
      }
    },
    data_breach: {
      title: `${incident.type.toUpperCase()} Incident Response Plan`,
      phases: {
        preparation: [
          "Define data classification policy",
          "Establish breach notification process",
          "Engage legal counsel",
          "Prepare PR response templates",
          "Implement data encryption"
        ],
        detection_analysis: [
          "Monitor database activity logs",
          "Analyze access patterns",
          "Identify compromised data",
          "Determine breach scope",
          "Check for data exfiltration"
        ],
        containment: [
          "Isolate affected database servers",
          "Block suspicious IP addresses",
          "Reset database credentials",
          "Enable additional logging",
          "Review firewall rules"
        ],
        eradication: [
          "Remove unauthorized access",
          "Patch database vulnerabilities",
          "Close unnecessary ports",
          "Deploy additional controls"
        ],
        recovery: [
          "Restore database from clean backup",
          "Implement database encryption",
          "Enhance access controls",
          "Monitor for further activity"
        ],
        lessons_learned: [
          "Implement database monitoring",
          "Regular security audits",
          "Data encryption strategy",
          "Improved access control policies"
        ]
      }
    },
    default: {
      title: `Incident Response Plan`,
      phases: {
        preparation: [
          "Define incident response team",
          "Establish communication channels",
          "Document response procedures",
          "Conduct regular training"
        ],
        detection_analysis: [
          "Monitor security alerts",
          "Analyze incident indicators",
          "Collect evidence",
          "Determine scope"
        ],
        containment: [
          "Isolate affected systems",
          "Block malicious activity",
          "Preserve evidence",
          "Document actions taken"
        ],
        eradication: [
          "Remove threat from environment",
          "Patch vulnerabilities",
          "Clean infected systems"
        ],
        recovery: [
          "Restore systems from backup",
          "Verify system integrity",
          "Monitor for recurrence"
        ],
        lessons_learned: [
          "Document incident findings",
          "Identify improvement areas",
          "Update response procedures",
          "Share lessons with team"
        ]
      }
    }
  };

  const template = planTemplates[incident.type] || planTemplates.default;
  
  const newPlan: IncidentPlan = {
    id: `PLAN-${String(planCounter++).padStart(3, '0')}`,
    incidentId: incident.id,
    title: template.title,
    summary: `AI-generated response plan for ${incident.type} incident. Review and customize as needed.`,
    phases: template.phases,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  plans = [...plans, newPlan];
  return newPlan;
}

// ----- ACTION FUNCTIONS -----
export function getIncidentActions(incidentId: string): IncidentAction[] {
  return actions.filter(a => a.incidentId === incidentId).sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export function addIncidentAction(data: {
  incidentId: string;
  phase: IncidentAction['phase'];
  action: string;
  description: string;
  performedBy: string;
  notes?: string;
}): IncidentAction {
  const newAction: IncidentAction = {
    id: `ACT-${String(actionCounter++).padStart(3, '0')}`,
    incidentId: data.incidentId,
    phase: data.phase,
    action: data.action,
    description: data.description,
    performedBy: data.performedBy,
    timestamp: new Date().toISOString(),
    notes: data.notes,
  };
  actions = [...actions, newAction];
  
  // Update incident status based on phase
  const incident = incidents.find(i => i.id === data.incidentId);
  if (incident) {
    if (data.phase === 'containment') incident.status = 'contained';
    else if (data.phase === 'eradication') incident.status = 'eradicated';
    else if (data.phase === 'recovery') incident.status = 'recovered';
    else if (data.phase === 'lessons_learned') incident.status = 'closed';
    incident.updatedAt = new Date().toISOString();
  }
  
  return newAction;
}

// ----- TASK FUNCTIONS -----
export function getIncidentTasks(incidentId: string): IncidentTask[] {
  return tasks.filter(t => t.incidentId === incidentId);
}

export function addIncidentTask(data: {
  incidentId: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
}): IncidentTask {
  const newTask: IncidentTask = {
    id: `TASK-${String(taskCounter++).padStart(3, '0')}`,
    incidentId: data.incidentId,
    title: data.title,
    description: data.description,
    assignedTo: data.assignedTo,
    status: 'pending',
    dueDate: data.dueDate,
    createdAt: new Date().toISOString(),
  };
  tasks = [...tasks, newTask];
  return newTask;
}

export function updateTaskStatus(taskId: string, status: IncidentTask['status']): IncidentTask | null {
  const index = tasks.findIndex(t => t.id === taskId);
  if (index === -1) return null;
  tasks[index].status = status;
  if (status === 'completed') {
    tasks[index].completedAt = new Date().toISOString();
  }
  return tasks[index];
}

// ----- EVIDENCE FUNCTIONS -----
export function getIncidentEvidence(incidentId: string): IncidentEvidence[] {
  return incidentEvidence.filter(e => e.incidentId === incidentId);
}

export function linkEvidenceToIncident(incidentId: string, evidenceId: string, name: string, type: string): IncidentEvidence {
  const newEvidence: IncidentEvidence = {
    id: `IE-${String(incidentCounter + 1).padStart(3, '0')}`,
    incidentId,
    evidenceId,
    name,
    type,
    linkedAt: new Date().toISOString(),
  };
  incidentEvidence = [...incidentEvidence, newEvidence];
  return newEvidence;
}

// ----- UTILITY FUNCTIONS -----
export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    informational: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return colors[severity] || colors.low;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: 'bg-red-500/20 text-red-400 border-red-500/30',
    investigating: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    contained: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    eradicated: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    recovered: 'bg-green-500/20 text-green-400 border-green-500/30',
    closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return colors[status] || colors.open;
}

export function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    preparation: '📋 Preparation',
    detection_analysis: '🔍 Detection & Analysis',
    containment: '🔒 Containment',
    eradication: '🗑️ Eradication',
    recovery: '💾 Recovery',
    lessons_learned: '📚 Lessons Learned',
  };
  return labels[phase] || phase;
}

export const incidentTypes = [
  'phishing', 'malware', 'ransomware', 'data_breach', 
  'unauthorized_access', 'insider_threat', 'web_attack', 
  'ddos', 'credential_theft', 'lost_device', 
  'email_compromise', 'unknown'
];

export const incidentSeverities = ['informational', 'low', 'medium', 'high', 'critical'];
export const incidentStatuses = ['open', 'investigating', 'contained', 'eradicated', 'recovered', 'closed'];
export const incidentPhases = ['preparation', 'detection_analysis', 'containment', 'eradication', 'recovery', 'lessons_learned'];