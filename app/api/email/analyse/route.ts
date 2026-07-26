import { NextRequest, NextResponse } from 'next/server';

// Simple email header extraction
function extractEmailHeaders(content: string) {
  const headers: any = {};
  const lines = content.split('\n');
  let bodyStart = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') {
      bodyStart = i + 1;
      break;
    }
    
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();
      headers[key] = value;
    }
  }
  
  const body = lines.slice(bodyStart).join('\n');
  
  return {
    from: headers['from'] || headers['sender'] || null,
    'sender-name': headers['from-name'] || null,
    to: headers['to'] || headers['recipient'] || null,
    cc: headers['cc'] || null,
    bcc: headers['bcc'] || null,
    subject: headers['subject'] || null,
    date: headers['date'] || null,
    'return-path': headers['return-path'] || null,
    'reply-to': headers['reply-to'] || null,
    'message-id': headers['message-id'] || null,
    'received': headers['received'] || null,
    'spf-status': headers['spf-status'] || headers['spf'] || null,
    'dkim-status': headers['dkim-status'] || headers['dkim'] || null,
    'dmarc-status': headers['dmarc-status'] || headers['dmarc'] || null,
    body: body.trim(),
    fullHeaders: headers
  };
}

// Detect if content looks like an email
function isEmailContent(content: string): boolean {
  const headers = ['from:', 'to:', 'subject:', 'date:', 'return-path:', 'reply-to:', 'message-id:', 'received:'];
  const lowerContent = content.toLowerCase();
  let headerCount = 0;
  for (const header of headers) {
    if (lowerContent.includes(header)) {
      headerCount++;
    }
  }
  return headerCount >= 2;
}

// Extract URLs
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  return text.match(urlRegex) || [];
}

// Extract IPs
function extractIps(text: string): string[] {
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
  const matches = text.match(ipRegex) || [];
  return matches.filter(ip => {
    const parts = ip.split('.');
    return parts.every(p => parseInt(p) >= 0 && parseInt(p) <= 255);
  });
}

// Detect phishing indicators
function detectPhishingIndicators(content: string): string[] {
  const indicators: string[] = [];
  const lowerContent = content.toLowerCase();
  
  const phishingPatterns = [
    { pattern: /urgent|immediate|action required/i, message: 'Urgency language detected' },
    { pattern: /verify your account|confirm your identity/i, message: 'Account verification request' },
    { pattern: /password reset|change your password/i, message: 'Password reset request' },
    { pattern: /click here|click the link|click below/i, message: 'Suspicious link prompt' },
    { pattern: /bank|credit card|payment|invoice/i, message: 'Financial reference detected' },
    { pattern: /suspended|deactivated|locked/i, message: 'Account suspension threat' },
    { pattern: /unusual activity|suspicious login/i, message: 'Unusual activity alert' },
    { pattern: /microsoft|google|apple|paypal|amazon/i, message: 'Brand impersonation possible' },
    { pattern: /attachment|download|open this file/i, message: 'Attachment prompt' },
    { pattern: /update your account|confirm your email/i, message: 'Account update request' },
    { pattern: /security alert|security notice/i, message: 'Security alert' },
    { pattern: /irs|tax|government/i, message: 'Government impersonation' },
  ];
  
  for (const pattern of phishingPatterns) {
    if (pattern.pattern.test(lowerContent)) {
      indicators.push(pattern.message);
    }
  }
  
  return indicators;
}

// Calculate risk score
function calculateRiskScore(parsed: any, phishingIndicators: string[], suspiciousUrls: string[], suspiciousIps: string[]): { score: number, level: string } {
  let score = 0;
  
  // Check SPF, DKIM, DMARC
  if (parsed['spf-status']) {
    if (parsed['spf-status'].toLowerCase().includes('fail')) score += 20;
    else if (parsed['spf-status'].toLowerCase().includes('pass')) score -= 5;
  }
  if (parsed['dkim-status']) {
    if (parsed['dkim-status'].toLowerCase().includes('fail')) score += 20;
    else if (parsed['dkim-status'].toLowerCase().includes('pass')) score -= 5;
  }
  if (parsed['dmarc-status']) {
    if (parsed['dmarc-status'].toLowerCase().includes('fail')) score += 20;
    else if (parsed['dmarc-status'].toLowerCase().includes('pass')) score -= 5;
  }
  
  // Phishing indicators
  score += phishingIndicators.length * 8;
  
  // Suspicious URLs
  score += suspiciousUrls.length * 5;
  
  // Suspicious IPs
  score += suspiciousIps.length * 3;
  
  // Missing headers
  if (!parsed.from) score += 10;
  if (!parsed.to) score += 10;
  if (!parsed.subject) score += 5;
  
  // Cap at 100
  score = Math.min(Math.max(score, 0), 100);
  
  let level = 'Low';
  if (score >= 70) level = 'Critical';
  else if (score >= 50) level = 'High';
  else if (score >= 30) level = 'Medium';
  
  return { score, level };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, caseId, fileName } = body;
    
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'No email content provided' },
        { status: 400 }
      );
    }
    
    // Check if content looks like an email
    if (!isEmailContent(content)) {
      return NextResponse.json({
        isEmail: false,
        error: 'This does not appear to be a valid email file. Missing email headers (From:, To:, Subject:, etc.)',
        suggestions: [
          'Make sure the file contains email headers',
          'For .eml files, headers should be at the top',
          'For .txt files, include the full email with headers',
          'Try pasting the email content directly'
        ],
        summary: 'File does not contain valid email headers',
        risk_level: 'Unknown',
        risk_score: 0,
        sender: null,
        recipient: null,
        subject: null,
        date: null,
        spf_status: null,
        dkim_status: null,
        dmarc_status: null,
        suspicious_urls: [],
        suspicious_ips: [],
        phishing_indicators: ['Not a valid email file'],
        findings: ['File does not contain email headers'],
        recommendations: ['Please upload a valid email file (.eml, .msg) or paste the email content with headers'],
        attachment_count: 0,
        malware_detected: false
      });
    }
    
    // Parse email headers
    const parsed = extractEmailHeaders(content);
    
    // Extract URLs
    const allUrls = extractUrls(content);
    const suspiciousUrls = allUrls.filter(url => {
      const lowerUrl = url.toLowerCase();
      return lowerUrl.includes('bit.ly') || 
             lowerUrl.includes('tinyurl') || 
             lowerUrl.includes('short') ||
             lowerUrl.includes('secure-') ||
             lowerUrl.includes('verify') ||
             lowerUrl.includes('confirm') ||
             lowerUrl.includes('update') ||
             lowerUrl.includes('account') ||
             lowerUrl.includes('login') ||
             lowerUrl.includes('signin');
    });
    
    // Extract IPs
    const suspiciousIps = extractIps(content);
    
    // Detect attachments
    const hasAttachments = content.toLowerCase().includes('attachment') || 
                           content.toLowerCase().includes('filename=') ||
                           content.toLowerCase().includes('content-type: application');
    const attachmentCount = hasAttachments ? 1 : 0;
    const attachmentNames = hasAttachments ? ['attachment detected'] : [];
    
    // Detect malware indicators
    const malwareKeywords = ['exe', 'zip', 'rar', '7z', 'payload', 'malware', 'virus', 'trojan', 'ransomware'];
    const malwareDetected = malwareKeywords.some(keyword => content.toLowerCase().includes(keyword));
    
    // Detect phishing indicators
    const phishingIndicators = detectPhishingIndicators(content);
    
    // Calculate risk
    const { score, level } = calculateRiskScore(parsed, phishingIndicators, suspiciousUrls, suspiciousIps);
    
    // Calculate spam score (secondary risk metric)
    const spamScore = Math.min(Math.max(score - 20, 0), 100);
    
    // Generate findings
    const findings: string[] = [];
    if (parsed.from) findings.push(`Sender: ${parsed.from}`);
    if (parsed.to) findings.push(`Recipient: ${parsed.to}`);
    if (parsed.subject) findings.push(`Subject: ${parsed.subject}`);
    if (parsed.date) findings.push(`Date: ${parsed.date}`);
    if (parsed['spf-status']) findings.push(`SPF: ${parsed['spf-status']}`);
    if (parsed['dkim-status']) findings.push(`DKIM: ${parsed['dkim-status']}`);
    if (parsed['dmarc-status']) findings.push(`DMARC: ${parsed['dmarc-status']}`);
    if (suspiciousUrls.length > 0) findings.push(`⚠️ ${suspiciousUrls.length} suspicious URLs detected`);
    if (suspiciousIps.length > 0) findings.push(`⚠️ ${suspiciousIps.length} suspicious IPs detected`);
    if (phishingIndicators.length > 0) findings.push(`🎣 ${phishingIndicators.length} phishing indicators detected`);
    if (malwareDetected) findings.push(`⚠️ Malware indicators detected`);
    if (hasAttachments) findings.push(`📎 Attachments present (${attachmentCount} file(s))`);
    
    // Generate summary
    let summary = `Email analysis complete. `;
    if (parsed.from) summary += `From: ${parsed.from}. `;
    if (parsed.subject) summary += `Subject: ${parsed.subject}. `;
    if (level === 'Critical' || level === 'High') {
      summary += `⚠️ This email shows signs of being suspicious. `;
    } else if (level === 'Medium') {
      summary += `⚠️ This email has some suspicious elements. `;
    } else {
      summary += `This email appears to be legitimate. `;
    }
    if (suspiciousUrls.length > 0) {
      summary += `${suspiciousUrls.length} suspicious URLs found. `;
    }
    if (phishingIndicators.length > 0) {
      summary += `${phishingIndicators.length} phishing indicators detected.`;
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (level === 'Critical' || level === 'High') {
      recommendations.push('🚨 Do NOT click on any links in this email');
      recommendations.push('🚨 Do NOT download or open any attachments');
      recommendations.push('🚨 Verify the sender\'s email address carefully');
      recommendations.push('🚨 Report this email to your security team immediately');
      recommendations.push('🚨 Do not reply to this email');
    } else if (level === 'Medium') {
      recommendations.push('⚠️ Exercise caution when interacting with this email');
      recommendations.push('⚠️ Verify the sender\'s identity before responding');
      recommendations.push('⚠️ Check for any unexpected attachments');
      recommendations.push('⚠️ Hover over links to check their destination');
    } else {
      recommendations.push('✅ This email appears legitimate, but always verify before clicking links');
      recommendations.push('✅ Keep this email as evidence for the case');
    }
    
    if (suspiciousUrls.length > 0) {
      recommendations.push(`🚨 Do not visit these URLs: ${suspiciousUrls.slice(0, 3).join(', ')}`);
    }
    
    if (malwareDetected) {
      recommendations.push('🚨 Malware indicators detected. Scan attachments before opening.');
    }

    return NextResponse.json({
      isEmail: true,
      sender: parsed.from || null,
      sender_name: parsed['sender-name'] || null,
      recipient: parsed.to || null,
      cc: parsed.cc ? parsed.cc.split(',').map((s: string) => s.trim()) : [],
      bcc: parsed.bcc ? parsed.bcc.split(',').map((s: string) => s.trim()) : [],
      subject: parsed.subject || null,
      message_id: parsed['message-id'] || null,
      reply_to: parsed['reply-to'] || null,
      return_path: parsed['return-path'] || null,
      date: parsed.date || null,
      spf_status: parsed['spf-status'] || null,
      dkim_status: parsed['dkim-status'] || null,
      dmarc_status: parsed['dmarc-status'] || null,
      suspicious_urls: suspiciousUrls.slice(0, 10),
      suspicious_ips: suspiciousIps.slice(0, 10),
      phishing_indicators: phishingIndicators,
      risk_score: score,
      risk_level: level,
      spam_score: spamScore,
      summary: summary,
      findings: findings,
      recommendations: recommendations,
      attachment_count: attachmentCount,
      attachment_names: attachmentNames,
      malware_detected: malwareDetected,
      body_preview: parsed.body ? parsed.body.substring(0, 500) + (parsed.body.length > 500 ? '...' : '') : null,
    });
    
  } catch (error) {
    console.error('Email analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze email. Please try again.' },
      { status: 500 }
    );
  }
}