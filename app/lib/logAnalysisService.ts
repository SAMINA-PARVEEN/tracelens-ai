// ============================================================
// LOG ANALYSIS SERVICE - Complete Log Analysis
// ============================================================

export interface LogAnalysisResult {
  totalLines: number;
  safeEvents: number;
  suspicious: number;
  threats: number;
  errors: number;
  warnings: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  riskColor: string;
  summary: string;
  recommendations: string[];
  keyFindings: string[];
  timeline: { time: string; event: string; type: string }[];
}

/**
 * Analyze logs using OpenRouter AI (if API key available)
 * or fallback to pattern analysis
 */
export async function analyzeLogs(logs: string): Promise<LogAnalysisResult> {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  if (apiKey) {
    try {
      const result = await analyzeWithAI(logs, apiKey);
      return result;
    } catch (error) {
      console.warn('AI analysis failed, using pattern analysis:', error);
      return analyzeWithPatterns(logs);
    }
  }

  return analyzeWithPatterns(logs);
}

/**
 * AI-based log analysis using OpenRouter
 */
async function analyzeWithAI(logs: string, apiKey: string): Promise<LogAnalysisResult> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'TraceLens AI - Log Analysis',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        {
          role: 'system',
          content: `You are a cybersecurity log analyst. Analyze the provided logs and return ONLY valid JSON with this exact structure:
          {
            "summary": "Brief summary of findings in 1-2 sentences",
            "threats": number,
            "suspicious": number,
            "safeEvents": number,
            "totalLines": number,
            "riskLevel": "Low|Medium|High|Critical",
            "recommendations": ["rec1", "rec2", "rec3"],
            "keyFindings": ["finding1", "finding2", "finding3"]
          }
          Do not add any other text. Only return the JSON.`,
        },
        {
          role: 'user',
          content: `Analyze these logs and return JSON:\n\n${logs.slice(0, 8000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const aiResponse = data.choices?.[0]?.message?.content;
  
  if (!aiResponse) {
    throw new Error('No response from AI');
  }

  let cleanResponse = aiResponse;
  if (cleanResponse.includes('```json')) {
    cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  }
  if (cleanResponse.includes('```')) {
    cleanResponse = cleanResponse.replace(/```\s*/g, '');
  }

  const parsed = JSON.parse(cleanResponse);
  
  return {
    totalLines: parsed.totalLines || 0,
    safeEvents: parsed.safeEvents || 0,
    suspicious: parsed.suspicious || 0,
    threats: parsed.threats || 0,
    errors: 0,
    warnings: 0,
    riskLevel: parsed.riskLevel || 'Low',
    riskColor: getRiskColor(parsed.riskLevel || 'Low'),
    summary: parsed.summary || 'Analysis complete.',
    recommendations: parsed.recommendations || ['Review logs for unusual patterns'],
    keyFindings: parsed.keyFindings || [],
    timeline: [],
  };
}

/**
 * Pattern-based log analysis (Fallback)
 */
function analyzeWithPatterns(logs: string): LogAnalysisResult {
  const lines = logs.split('\n').filter((l: string) => l.trim().length > 0);
  
  let failedLogins = 0;
  let unauthorizedAccess = 0;
  let suspiciousIPs = 0;
  let safeEvents = 0;
  let errors = 0;
  let warnings = 0;
  
  const patterns = {
    failedLogin: /failed login|login failed|authentication failure|invalid password|incorrect password|401|authentication failed/i,
    unauthorized: /unauthorized|access denied|permission denied|403|forbidden|access violation/i,
    suspiciousIP: /\b(192\.168\.[0-9]+\.[0-9]+|10\.[0-9]+\.[0-9]+\.[0-9]+|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]+\.[0-9]+)\b/i,
    error: /error|exception|failed|failure|critical/i,
    warning: /warning|warn|caution/i,
    safe: /success|ok|completed|successfully|200|connected|established/i,
  };
  
  for (const line of lines) {
    if (patterns.failedLogin.test(line)) failedLogins++;
    else if (patterns.unauthorized.test(line)) unauthorizedAccess++;
    else if (patterns.suspiciousIP.test(line)) suspiciousIPs++;
    else if (patterns.error.test(line)) errors++;
    else if (patterns.warning.test(line)) warnings++;
    else if (patterns.safe.test(line)) safeEvents++;
  }
  
  const totalThreats = failedLogins + unauthorizedAccess + suspiciousIPs;
  
  let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  if (totalThreats > 100) riskLevel = 'Critical';
  else if (totalThreats > 50) riskLevel = 'High';
  else if (totalThreats > 10) riskLevel = 'Medium';
  
  const recommendations = [];
  if (totalThreats > 50) {
    recommendations.push('🚨 Immediate action required: High number of threats detected');
  }
  if (failedLogins > 10) {
    recommendations.push('🔒 Enable account lockout policy after 3 failed attempts');
    recommendations.push('🛡️ Implement multi-factor authentication (MFA)');
  }
  if (unauthorizedAccess > 5) {
    recommendations.push('🔐 Review access control lists (ACLs)');
    recommendations.push('📋 Conduct user permission audit');
  }
  if (totalThreats === 0) {
    recommendations.push('✅ No threats detected. System appears secure.');
  }
  if (recommendations.length === 0) {
    recommendations.push('📊 Review logs regularly for unusual patterns');
  }
  
  // Generate timeline of suspicious events
  const timeline: { time: string; event: string; type: string }[] = [];
  let eventCount = 0;
  for (const line of lines) {
    if (eventCount >= 10) break;
    if (patterns.failedLogin.test(line) || 
        patterns.unauthorized.test(line) ||
        patterns.error.test(line)) {
      eventCount++;
      timeline.push({
        time: `Event ${eventCount}`,
        event: line.substring(0, 100),
        type: patterns.error.test(line) ? 'error' : 
              patterns.failedLogin.test(line) ? 'auth' : 'access'
      });
    }
  }
  
  // Extract key findings
  const keyFindings: string[] = [];
  if (failedLogins > 0) keyFindings.push(`🔴 ${failedLogins} failed login attempts detected`);
  if (unauthorizedAccess > 0) keyFindings.push(`🔴 ${unauthorizedAccess} unauthorized access attempts`);
  if (suspiciousIPs > 0) keyFindings.push(`🔴 ${suspiciousIPs} suspicious IP addresses found`);
  if (errors > 0) keyFindings.push(`⚠️ ${errors} errors found in logs`);
  if (keyFindings.length === 0) keyFindings.push('✅ No suspicious activity found');
  
  return {
    totalLines: lines.length,
    safeEvents: Math.max(safeEvents, lines.length - totalThreats - errors - warnings),
    suspicious: suspiciousIPs || 0,
    threats: totalThreats || 0,
    errors: errors || 0,
    warnings: warnings || 0,
    riskLevel: riskLevel,
    riskColor: getRiskColor(riskLevel),
    summary: `Analysis of ${lines.length} log entries detected ${totalThreats} potential security threats, including ${failedLogins} failed login attempts, ${unauthorizedAccess} unauthorized access attempts, and ${suspiciousIPs} suspicious IP addresses.`,
    recommendations: recommendations,
    keyFindings: keyFindings,
    timeline: timeline,
  };
}

function getRiskColor(level: string): string {
  const colors: Record<string, string> = {
    'Low': 'green',
    'Medium': 'yellow',
    'High': 'orange',
    'Critical': 'red',
  };
  return colors[level] || 'green';
}