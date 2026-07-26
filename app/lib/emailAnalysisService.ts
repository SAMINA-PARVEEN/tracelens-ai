// ============================================================
// EMAIL ANALYSIS SERVICE - Professional Email Analysis
// ============================================================

export interface EmailAnalysisResult {
  risk: 'High' | 'Medium' | 'Low' | 'Invalid';
  confidence: string;
  sender: string;
  subject: string;
  indicators: string[];
  summary: string;
  recommendation: string;
  headers?: Record<string, string>;
  links?: string[];
  isValidEmail: boolean;
  validationMessage?: string;
  fileType?: string;
}

/**
 * Check if content is a valid email (works for .eml, .msg, .txt)
 */
function isValidEmailContent(content: string): { valid: boolean; message?: string } {
  // Trim content
  const trimmedContent = content.trim();
  
  // Check if file is empty
  if (!trimmedContent || trimmedContent.length === 0) {
    return {
      valid: false,
      message: '❌ File is empty. Please upload a file with email content.'
    };
  }

  // Check for minimum length (an email should have at least some content)
  if (trimmedContent.length < 10) {
    return {
      valid: false,
      message: '❌ File is too small. This does not appear to be an email file.'
    };
  }

  // Check for email headers (From, Subject, To - at least one should exist)
  const hasFrom = /^From:\s*.+$/m.test(trimmedContent);
  const hasSubject = /^Subject:\s*.+$/m.test(trimmedContent);
  const hasTo = /^To:\s*.+$/m.test(trimmedContent);
  const hasDate = /^Date:\s*.+$/m.test(trimmedContent);
  
  // For .txt files, check if content looks like an email
  // Check for email pattern (contains @ and some text that looks like email)
  const hasEmailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmedContent);
  
  // Check if content has any reasonable text (not just random characters)
  const hasReadableText = /[a-zA-Z]{5,}/.test(trimmedContent);
  
  // If no headers and no email pattern, it's not an email
  if (!hasFrom && !hasSubject && !hasTo && !hasDate && !hasEmailPattern) {
    // Check if it's just random text
    if (!hasReadableText) {
      return {
        valid: false,
        message: '❌ This file does not contain readable text. It does not appear to be an email file.'
      };
    }
    return {
      valid: false,
      message: '❌ This file does not contain email headers (From, Subject, To) or an email address pattern. Please upload a valid email file.'
    };
  }

  // Check for email body (some content after headers)
  const bodyMatch = trimmedContent.match(/\n\n([\s\S]+)$/);
  const hasBody = bodyMatch && bodyMatch[1] && bodyMatch[1].trim().length > 0;
  
  // If it has headers but no body, it might be a partial email
  if ((hasFrom || hasSubject || hasTo) && !hasBody) {
    // Check if there's content that could be a body (not just headers)
    const lines = trimmedContent.split('\n');
    const contentLines = lines.filter(line => 
      !line.match(/^(From|To|Subject|Date|Reply-To|Return-Path|Message-ID|Content-Type|MIME-Version|Received):/i)
    );
    const hasContent = contentLines.some(line => line.trim().length > 0);
    
    if (!hasContent) {
      return {
        valid: false,
        message: '❌ This file contains email headers but no email body. The email content is missing.'
      };
    }
  }

  return { valid: true };
}

/**
 * Analyze email - Professional version
 */
export async function analyzeEmail(emailContent: string): Promise<EmailAnalysisResult> {
  // ============================================================
  // STEP 1: Validate Email Format
  // ============================================================
  const validation = isValidEmailContent(emailContent);
  
  if (!validation.valid) {
    return {
      risk: 'Invalid',
      confidence: 'N/A',
      sender: 'Not Available',
      subject: 'Not Available',
      indicators: ['❌ Not a valid email'],
      summary: validation.message || 'This file does not appear to be a valid email file.',
      recommendation: 'Please upload a valid email file (.eml, .msg, or .txt with email content). The file should contain headers like From, Subject, To and email body.',
      isValidEmail: false,
      validationMessage: validation.message,
    };
  }

  // ============================================================
  // STEP 2: Extract Email Data
  // ============================================================
  const fromMatch = emailContent.match(/^From:\s*(.+)$/m);
  const subjectMatch = emailContent.match(/^Subject:\s*(.+)$/m);
  const toMatch = emailContent.match(/^To:\s*(.+)$/m);
  const dateMatch = emailContent.match(/^Date:\s*(.+)$/m);
  const bodyMatch = emailContent.match(/\n\n([\s\S]+)$/);
  const bodyText = bodyMatch ? bodyMatch[1].trim() : emailContent;
  
  const sender = fromMatch ? fromMatch[1].trim() : 
                 (emailContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || [''])[0] || 'Unknown';
  const subject = subjectMatch ? subjectMatch[1].trim() : 'No Subject';
  const recipient = toMatch ? toMatch[1].trim() : 'Unknown';
  const date = dateMatch ? dateMatch[1].trim() : 'Unknown';
  
  // ============================================================
  // STEP 3: AI Analysis (if API key available)
  // ============================================================
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  
  if (apiKey) {
    try {
      const result = await analyzeWithAI(emailContent, apiKey);
      return { ...result, isValidEmail: true };
    } catch (error) {
      console.warn('AI analysis failed, using pattern analysis:', error);
      const result = analyzeWithPatterns(emailContent, sender, subject, recipient, date, bodyText);
      return { ...result, isValidEmail: true };
    }
  }

  // ============================================================
  // STEP 4: Pattern Analysis (Fallback)
  // ============================================================
  const result = analyzeWithPatterns(emailContent, sender, subject, recipient, date, bodyText);
  return { ...result, isValidEmail: true };
}

/**
 * AI-based email analysis using OpenRouter
 */
async function analyzeWithAI(emailContent: string, apiKey: string): Promise<EmailAnalysisResult> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'TraceLens AI - Email Analysis',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        {
          role: 'system',
          content: `You are a professional phishing email analyst. Analyze the provided email and return ONLY valid JSON with this exact structure:
          {
            "risk": "High|Medium|Low",
            "confidence": "percentage as string e.g. 92%",
            "sender": "sender email address",
            "subject": "email subject",
            "indicators": ["indicator1", "indicator2", "indicator3"],
            "summary": "Professional summary of findings",
            "recommendation": "Actionable recommendation"
          }
          Do not add any other text. Only return the JSON.`,
        },
        {
          role: 'user',
          content: `Analyze this email professionally and return JSON:\n\n${emailContent.slice(0, 8000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
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
    risk: parsed.risk || 'Low',
    confidence: parsed.confidence || '70%',
    sender: parsed.sender || 'Unknown',
    subject: parsed.subject || 'Unknown',
    indicators: parsed.indicators || ['No indicators found'],
    summary: parsed.summary || 'Analysis complete.',
    recommendation: parsed.recommendation || 'No specific recommendation.',
    isValidEmail: true,
  };
}

/**
 * Pattern-based email analysis (Professional Fallback)
 */
function analyzeWithPatterns(
  emailContent: string, 
  sender: string, 
  subject: string, 
  recipient: string, 
  date: string, 
  body: string
): EmailAnalysisResult {
  const indicators: string[] = [];
  let risk: 'High' | 'Medium' | 'Low' = 'Low';
  let confidence = '70%';
  
  // ============================================================
  // PROFESSIONAL PATTERN DETECTION
  // ============================================================
  
  // 1. Check if email has proper structure
  if (sender === 'Unknown' || sender === 'Not Available') {
    indicators.push('📧 Sender information could not be extracted');
  }
  
  if (subject === 'No Subject' || subject === 'Not Available') {
    indicators.push('📧 No subject line found');
  }
  
  // 2. Urgency Detection
  const urgencyPatterns = /urgent|immediate|action required|verify|confirm|account|password|security|alert|suspicious|unusual|unauthorized|suspended|limited|restricted|locked|deactivated|compromised/i;
  if (urgencyPatterns.test(body) || urgencyPatterns.test(subject)) {
    indicators.push('⚠️ Urgent action required language detected');
    risk = 'Medium';
  }
  
  // 3. Phishing Keywords
  const phishingKeywords = /verify|confirm|update|validate|restore|unlock|reactivate|secure|account|password|credit card|bank|paypal|apple|microsoft|google/i;
  const phishingCount = (body.match(phishingKeywords) || []).length;
  if (phishingCount >= 3) {
    indicators.push(`📧 ${phishingCount} phishing-related keywords detected`);
    risk = risk === 'Low' ? 'Medium' : risk;
  }
  
  // 4. Suspicious Links
  const linkPattern = /https?:\/\/[^\s<>"]+/g;
  const links = body.match(linkPattern) || [];
  
  // Check if links are suspicious
  let suspiciousLinkCount = 0;
  for (const link of links) {
    if (link.includes('security-verify') || 
        link.includes('account-verify') || 
        link.includes('confirm-identity') ||
        link.includes('secure-login') ||
        link.includes('verify-now') ||
        !link.includes('company.com') && !link.includes('trusted.com')) {
      suspiciousLinkCount++;
    }
  }
  
  if (suspiciousLinkCount > 0) {
    indicators.push(`🔗 ${suspiciousLinkCount} suspicious link(s) detected`);
    risk = risk === 'Low' ? 'Medium' : risk;
  }
  
  if (links.length > 0 && suspiciousLinkCount === links.length) {
    indicators.push(`🔴 All ${links.length} links appear suspicious`);
    risk = 'High';
  }
  
  // 5. Domain Mismatch (Spoofing)
  const replyToMatch = emailContent.match(/^Reply-To:\s*(.+)$/m);
  if (replyToMatch) {
    const fromDomain = sender.split('@')[1] || '';
    const replyDomain = replyToMatch[1].split('@')[1] || '';
    if (fromDomain && replyDomain && fromDomain !== replyDomain) {
      indicators.push(`🎯 Domain mismatch: From (${fromDomain}) vs Reply-To (${replyDomain})`);
      risk = 'High';
    }
  }
  
  // 6. Suspicious Sender Domain
  if (sender && sender.includes('@')) {
    const domain = sender.split('@')[1] || '';
    if (domain.includes('security-verify') || 
        domain.includes('account-verify') ||
        domain.includes('secure-') ||
        domain.includes('-security') ||
        !domain.includes('.com') && !domain.includes('.org') && !domain.includes('.net')) {
      indicators.push(`📧 Suspicious sender domain: ${domain}`);
      risk = risk === 'Low' ? 'Medium' : risk;
    }
    
    // Check for brand impersonation
    const knownBrands = ['paypal', 'bank', 'apple', 'microsoft', 'google', 'amazon'];
    for (const brand of knownBrands) {
      if (domain.includes(brand) && !domain.endsWith('.com') && !domain.endsWith('.org')) {
        indicators.push(`🎯 Possible brand impersonation: ${brand} in domain`);
        risk = 'High';
      }
    }
  }
  
  // 7. Personal Information Request
  const personalInfoPatterns = /ssn|social security|credit card|bank account|password|username|login|credentials|verify identity/i;
  if (personalInfoPatterns.test(body)) {
    indicators.push('🔒 Request for personal/sensitive information detected');
    risk = risk === 'Low' ? 'Medium' : risk;
  }
  
  // 8. Grammar/Spelling Issues
  const grammarErrors = body.match(/\b(teh|taht|waht|recieve|seperate|definately|alot|thier)\b/gi) || [];
  if (grammarErrors.length >= 2) {
    indicators.push(`📝 ${grammarErrors.length} potential grammar/spelling issues detected`);
    risk = risk === 'Low' ? 'Medium' : risk;
  }
  
  // ============================================================
  // CALCULATE FINAL RISK
  // ============================================================
  
  if (risk === 'High' || indicators.some(i => i.includes('🎯') || i.includes('🔴'))) {
    risk = 'High';
    confidence = '92%';
  } else if (indicators.length >= 4) {
    risk = 'High';
    confidence = '88%';
  } else if (indicators.length >= 2) {
    risk = 'Medium';
    confidence = '78%';
  } else if (indicators.length >= 1) {
    risk = 'Low';
    confidence = '65%';
  } else {
    risk = 'Low';
    confidence = '90%';
    indicators.push('✅ No suspicious patterns detected');
  }
  
  // ============================================================
  // GENERATE SUMMARY
  // ============================================================
  let summary = '';
  if (risk === 'High') {
    summary = `⚠️ This email contains ${indicators.length} suspicious indicators including spoofing attempts, suspicious links, and urgent language. It appears to be a phishing attempt with high confidence. Do not click any links or open attachments.`;
  } else if (risk === 'Medium') {
    summary = `⚠️ This email shows ${indicators.length} suspicious patterns including urgent language and suspicious requests. Exercise caution and verify sender identity before taking any action.`;
  } else if (risk === 'Low') {
    summary = `✅ This email appears to be legitimate with ${indicators.length} minor suspicious patterns. No significant threats detected.`;
  } else {
    summary = `📧 Valid email with ${indicators.length} indicators. Review recommended.`;
  }
  
  // ============================================================
  // GENERATE RECOMMENDATION
  // ============================================================
  let recommendation = '';
  if (risk === 'High') {
    recommendation = `🚨 IMMEDIATE ACTION REQUIRED:
• Do not click any links or open attachments
• Do not reply to this email
• Mark as phishing in your email client
• Block the sender
• Report to IT Security team immediately
• If you clicked any links, run a security scan`;
  } else if (risk === 'Medium') {
    recommendation = `⚠️ RECOMMENDED ACTION:
• Verify sender identity through alternative means
• Do not click links without verification
• Do not share sensitive information
• Forward to IT Security for review if unsure`;
  } else if (risk === 'Low') {
    recommendation = `✅ No action required. Email appears safe. Continue with normal review process.`;
  } else {
    recommendation = `📧 Review email content and verify sender before responding.`;
  }
  
  // ============================================================
  // RETURN RESULT
  // ============================================================
  return {
    risk,
    confidence,
    sender,
    subject,
    indicators: indicators.length > 0 ? indicators : ['No indicators found'],
    summary,
    recommendation,
    links: links.length > 0 ? links : undefined,
    isValidEmail: true,
  };
}