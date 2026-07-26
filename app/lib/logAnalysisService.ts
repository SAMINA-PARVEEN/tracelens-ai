// ============================================================
// LOG ANALYSIS SERVICE - STRICT LOG DETECTION
// ============================================================

export interface LogAnalysisResult {
  totalLines: number;
  safeEvents: number;
  suspicious: number;
  threats: number;
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  isLogFile: boolean;
  detectionConfidence: number;
  detectionReason: string;
}

// ============ STRICT LOG DETECTION ============
function isActualLogContent(content: string): { 
  isLog: boolean; 
  confidence: number; 
  reason: string;
  details: string[];
} {
  if (!content || content.trim().length < 10) {
    return { 
      isLog: false, 
      confidence: 0, 
      reason: 'Content is empty or too short',
      details: ['File is empty or too short to be a log file']
    };
  }

  const lines = content.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 3) {
    return { 
      isLog: false, 
      confidence: 0, 
      reason: 'Too few lines (need at least 3)',
      details: ['Log files typically have many lines of entries']
    };
  }

  // Check for log line structure - each line should look like a log entry
  // A log entry typically has: [timestamp] [level] [message] or similar
  const logLinePatterns = [
    /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/, // 2024-01-15 14:30:25
    /^\d{2}:\d{2}:\d{2}\s+\d{2}:\d{2}:\d{2}/, // 14:30:25 2024-01-15
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // 2024-01-15T14:30:25
    /^\[.*?\]\s+\[.*?\]/, // [timestamp] [level]
    /^\[.*?\]\s+[A-Z]/, // [timestamp] INFO
    /^\s*[A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/, // Jan 15 14:30:25
    /^\s*<\d+>\s+[A-Za-z]/, // <134> syslog format
    /^\d{2}:\d{2}:\d{2}\s+[A-Za-z]/, // 14:30:25 INFO
    /^\d{4}-\d{2}-\d{2}\s+[A-Za-z]/, // 2024-01-15 INFO
  ];

  let logLineCount = 0;
  let timestampLineCount = 0;
  let logLevelLineCount = 0;
  let ipAddressCount = 0;
  let keyValueCount = 0;

  // Analyze each line
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check if line starts with a timestamp pattern (log entries usually start with timestamp)
    let isLogLine = false;
    for (const pattern of logLinePatterns) {
      if (pattern.test(trimmedLine)) {
        isLogLine = true;
        logLineCount++;
        break;
      }
    }

    // Check for timestamp anywhere in line
    if (/\d{4}-\d{2}-\d{2}/.test(trimmedLine) || /\d{2}:\d{2}:\d{2}/.test(trimmedLine) || /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/.test(trimmedLine)) {
      timestampLineCount++;
    }

    // Check for log levels - but only if they appear with context (not just the word alone)
    const logLevelRegex = /\b(ERROR|WARN|INFO|DEBUG|TRACE|FATAL)\b/i;
    const logLevelMatch = trimmedLine.match(logLevelRegex);
    if (logLevelMatch) {
      // Check if the log level appears with surrounding context (colon, brackets, etc.)
      const hasContext = /:\s*/.test(trimmedLine) || /\[.*?\]/.test(trimmedLine) || /\s+[A-Z]/.test(trimmedLine);
      if (hasContext) {
        logLevelLineCount++;
      }
    }

    // Check for IP addresses
    const ipMatch = trimmedLine.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g);
    if (ipMatch) {
      ipAddressCount += ipMatch.length;
    }

    // Check for key=value pairs
    if (/[A-Za-z0-9]+=[A-Za-z0-9]+/.test(trimmedLine)) {
      keyValueCount++;
    }
  }

  // Calculate percentages
  const totalLinesCount = lines.length;
  const logLinePercentage = (logLineCount / totalLinesCount) * 100;
  const timestampPercentage = (timestampLineCount / totalLinesCount) * 100;

  // STRICT RULES - Must meet ALL these conditions to be considered a log file
  const conditions = [];
  const details = [];

  // Condition 1: At least 30% of lines must start with timestamp format
  if (logLinePercentage >= 30) {
    conditions.push('logLinePattern');
    details.push(`✅ ${logLineCount}/${totalLinesCount} lines (${Math.round(logLinePercentage)}%) start with timestamp format`);
  } else {
    details.push(`❌ Only ${logLineCount}/${totalLinesCount} lines (${Math.round(logLinePercentage)}%) start with timestamp format (need ≥30%)`);
  }

  // Condition 2: At least 20% of lines must have timestamps
  if (timestampPercentage >= 20) {
    conditions.push('timestamp');
    details.push(`✅ ${timestampLineCount}/${totalLinesCount} lines (${Math.round(timestampPercentage)}%) have timestamps`);
  } else {
    details.push(`❌ Only ${timestampLineCount}/${totalLinesCount} lines (${Math.round(timestampPercentage)}%) have timestamps (need ≥20%)`);
  }

  // Condition 3: Must have at least 3 log levels OR 5 timestamps
  if (logLevelLineCount >= 3 || timestampLineCount >= 5) {
    conditions.push('logLevelOrTimestamp');
    details.push(`✅ ${logLevelLineCount} log levels and ${timestampLineCount} timestamps detected`);
  } else {
    details.push(`❌ Only ${logLevelLineCount} log levels and ${timestampLineCount} timestamps (need ≥3 log levels OR ≥5 timestamps)`);
  }

  // Condition 4: Average line length should be reasonable (not too long like README text)
  const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / totalLinesCount;
  if (avgLineLength < 200) {
    conditions.push('avgLineLength');
    details.push(`✅ Average line length: ${Math.round(avgLineLength)} characters (good)`);
  } else {
    details.push(`⚠️ Average line length: ${Math.round(avgLineLength)} characters (might be prose/text)`);
  }

  // Condition 5: At least 2 different log patterns
  let patternCount = 0;
  if (logLineCount > 0) patternCount++;
  if (timestampLineCount > 0) patternCount++;
  if (logLevelLineCount > 0) patternCount++;
  if (ipAddressCount > 0) patternCount++;
  if (keyValueCount > 0) patternCount++;

  if (patternCount >= 2) {
    conditions.push('multiplePatterns');
    details.push(`✅ ${patternCount} different log patterns detected`);
  } else {
    details.push(`❌ Only ${patternCount} different log patterns detected (need ≥2)`);
  }

  // DETERMINE IF LOG FILE
  // Must meet AT LEAST 3 of the 5 conditions
  const requiredConditions = 3;
  const metConditions = conditions.length;

  const isLog = metConditions >= requiredConditions;
  const confidence = Math.min(Math.round((metConditions / 5) * 100), 90);

  let reason = '';
  if (isLog) {
    reason = `Log file detected with ${metConditions}/5 conditions met (${confidence}% confidence)`;
  } else {
    reason = `Not a log file - only ${metConditions}/5 conditions met (${confidence}% confidence)`;
  }

  return {
    isLog,
    confidence,
    reason,
    details
  };
}

// ============ MAIN ANALYSIS FUNCTION ============
export async function analyzeLogs(logContent: string): Promise<LogAnalysisResult> {
  // First, check if this is actually a log file
  const detection = isActualLogContent(logContent);
  
  if (!detection.isLog) {
    // Build a detailed rejection message
    let summary = `❌ This file does NOT contain valid log data.\n\n`;
    summary += `📊 Detection Confidence: ${detection.confidence}%\n`;
    summary += `📋 Reason: ${detection.reason}\n\n`;
    summary += `🔍 Analysis Details:\n`;
    for (const detail of detection.details) {
      summary += `   ${detail}\n`;
    }
    summary += `\n💡 A valid log file should have:\n`;
    summary += `   • Lines starting with timestamps (e.g., 2024-01-15 14:30:25)\n`;
    summary += `   • Log levels (ERROR, WARN, INFO, DEBUG)\n`;
    summary += `   • IP addresses (e.g., 192.168.1.1)\n`;
    summary += `   • Consistent line format\n`;
    summary += `   • System events or messages\n`;
    summary += `\n📁 Please upload a file containing actual log entries.`;

    return {
      totalLines: 0,
      safeEvents: 0,
      suspicious: 0,
      threats: 0,
      summary: summary,
      keyFindings: [
        `⚠️ Not a valid log file`,
        `Confidence: ${detection.confidence}%`,
        `Reason: ${detection.reason}`,
        `Conditions met: ${detection.details.filter(d => d.startsWith('✅')).length}/5`,
        `Please upload a file with actual log data`
      ],
      recommendations: [
        'Upload a file with log entries (e.g., system logs, application logs)',
        'Log files should contain timestamps (e.g., 2024-01-15 14:30:25)',
        'Log files should contain log levels (ERROR, WARN, INFO, DEBUG)',
        'Log files should contain IP addresses or system events',
        'Lines should follow a consistent log format'
      ],
      riskLevel: 'Low',
      isLogFile: false,
      detectionConfidence: detection.confidence,
      detectionReason: detection.reason
    };
  }

  // ============ IF IT IS A LOG FILE, PROCEED WITH ANALYSIS ============
  const lines = logContent.split('\n').filter(line => line.trim() !== '');
  const totalLines = lines.length;

  // Define patterns for detection
  const threatPatterns = [
    /error|fail|denied|unauthorized|invalid|attack|exploit|malware|virus|threat|intrusion/i,
    /access\s+denied|permission\s+denied/i,
    /login\s+fail|authentication\s+fail/i,
    /sql\s+injection|xss|cross-site/i,
    /buffer\s+overflow|memory\s+corruption/i,
    /rootkit|backdoor|trojan|ransomware/i,
    /ddos|dos\s+attack|flood/i,
    /phishing|spoof|spam/i,
    /unauthorized\s+access|illegal\s+access/i,
  ];

  const suspiciousPatterns = [
    /warning|suspicious|unusual|abnormal|anomaly|unknown/i,
    /multiple\s+attempt|repeated\s+attempt|brute\s+force/i,
    /port\s+scan|scanning/i,
    /privilege\s+escalation|elevation/i,
    /command\s+injection|code\s+injection/i,
    /encrypted|encoded|obfuscated/i,
    /proxy|vpn|tor|anonymous/i,
  ];

  let threats = 0;
  let suspicious = 0;
  let safeEvents = 0;
  const threatLines: string[] = [];
  const suspiciousLines: string[] = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    let matched = false;

    for (const pattern of threatPatterns) {
      if (pattern.test(lowerLine)) {
        threats++;
        threatLines.push(line);
        matched = true;
        break;
      }
    }

    if (!matched) {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(lowerLine)) {
          suspicious++;
          suspiciousLines.push(line);
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      safeEvents++;
    }
  }

  let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  if (threats > 50) riskLevel = 'Critical';
  else if (threats > 20) riskLevel = 'High';
  else if (threats > 5) riskLevel = 'Medium';
  else if (suspicious > 20) riskLevel = 'Medium';
  else if (suspicious > 10) riskLevel = 'Low';

  let summary = '';
  if (threats > 0) {
    summary = `Analysis of ${totalLines} log entries detected ${threats} potential security threats. `;
    if (threatLines.length > 0) {
      summary += `First threat: "${threatLines[0].substring(0, 80)}..." `;
    }
  } else if (suspicious > 0) {
    summary = `Analysis of ${totalLines} log entries found ${suspicious} suspicious activities. `;
  } else {
    summary = `Analysis of ${totalLines} log entries found no threats or suspicious activities. `;
  }

  const keyFindings: string[] = [];

  const failedLogins = lines.filter(l => /login\s+fail|authentication\s+fail|invalid\s+password/i.test(l)).length;
  if (failedLogins > 0) {
    keyFindings.push(`🔴 ${failedLogins} failed login attempts detected`);
  }

  const unauthorized = lines.filter(l => /unauthorized|permission\s+denied|access\s+denied/i.test(l)).length;
  if (unauthorized > 0) {
    keyFindings.push(`🔴 ${unauthorized} unauthorized access attempts`);
  }

  const errors = lines.filter(l => /error|fail|exception/i.test(l)).length;
  if (errors > 0) {
    keyFindings.push(`🔴 ${errors} errors found in logs`);
  }

  const ipPattern = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g;
  const allIps = lines.flatMap(l => l.match(ipPattern) || []);
  const uniqueIps = [...new Set(allIps)];
  if (uniqueIps.length > 0) {
    keyFindings.push(`🟡 ${uniqueIps.length} unique IP addresses found`);
  }

  if (keyFindings.length === 0) {
    keyFindings.push(`✅ No threats or suspicious activities detected`);
    keyFindings.push(`📊 ${totalLines} log entries analyzed`);
  }

  const recommendations: string[] = [];
  if (threats > 0) {
    recommendations.push('🚨 Investigate all threat events immediately');
    if (failedLogins > 0) {
      recommendations.push('🔒 Review failed login attempts');
    }
    if (unauthorized > 0) {
      recommendations.push('🛡️ Review access control policies');
    }
  }

  if (suspicious > 0) {
    recommendations.push('⚠️ Investigate suspicious activities');
  }

  if (threats === 0 && suspicious === 0) {
    recommendations.push('✅ No threats detected. Continue monitoring');
  }

  recommendations.push('📁 Archive logs for future reference');
  recommendations.push('📊 Set up automated log monitoring');

  return {
    totalLines,
    safeEvents,
    suspicious,
    threats,
    summary,
    keyFindings,
    recommendations,
    riskLevel,
    isLogFile: true,
    detectionConfidence: detection.confidence,
    detectionReason: detection.reason
  };
}