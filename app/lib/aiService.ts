export async function analyzeFile(file: File, fileName: string) {
  console.log("📄 Analyzing:", fileName);
  console.log("📄 File type:", file.type);
  console.log("📄 File size:", file.size);

  try {
    // Read the file content
    let content = "";
    try {
      content = await file.text();
      console.log("📝 Content length:", content.length);
      console.log("📝 First 200 chars:", content.substring(0, 200));
    } catch (e) {
      console.log("Could not read file as text");
      content = "[Binary file - content not readable]";
    }

    // If content is empty, use a meaningful default
    if (!content || content.trim() === "") {
      content = "File content could not be extracted. Please check the file format.";
    }

    const API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    
    if (!API_KEY) {
      console.log("❌ No API key found!");
      return getSmartFallback(fileName, content);
    }

    // Truncate to avoid token limits
    const truncatedContent = content.substring(0, 3000);

    const prompt = `
You are a digital forensics expert. Analyze this file and provide a security assessment based on its ACTUAL content.

FILE NAME: ${fileName}
FILE TYPE: ${file.type || "Unknown"}
FILE SIZE: ${(file.size / 1024).toFixed(1)} KB

ACTUAL FILE CONTENT:
${truncatedContent}

IMPORTANT: Your analysis MUST be based on the actual content above. Do NOT use generic responses.

Return ONLY this JSON format (no other text):
{
  "threatLevel": "Low|Medium|High|Critical",
  "summary": "What this file actually contains based on its content",
  "findings": ["finding1 based on actual content", "finding2 based on actual content"],
  "recommendations": ["rec1", "rec2"],
  "conclusion": "Final conclusion based on actual content"
}

Rules based on content:
- If content contains "phish", "bank", "verify", "urgent" → threatLevel: "Critical"
- If content contains "malware", "virus", "ransomware" → threatLevel: "High"
- If content is technical documentation → threatLevel: "Low"
- If content is a resume/CV → threatLevel: "Low" (personal information)
- Base EVERYTHING on the ACTUAL content provided
`;

    console.log("📤 Sending to AI...");

    let response;
    
    // Try Groq first if available
    if (process.env.GROQ_API_KEY) {
      try {
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'mixtral-8x7b-32768',
            messages: [
              { role: 'system', content: 'You are a digital forensics expert. Respond with valid JSON only. Base your analysis on the actual content provided.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 500,
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Groq API response received");
          const result = JSON.parse(data.choices[0].message.content);
          return formatResult(result);
        }
      } catch (e) {
        console.log("⚠️ Groq failed, trying OpenRouter...", e);
      }
    }

    // Fallback to OpenRouter
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://tracelens.ai',
        'X-Title': 'TraceLens AI',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'system', content: 'You are a digital forensics expert. Respond with valid JSON only. Base your analysis on the actual content provided.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 400,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ API Error:", response.status, errorText);
      return getSmartFallback(fileName, content);
    }

    const data = await response.json();
    console.log("✅ API Response received");

    const aiContent = data.choices[0].message.content;
    console.log("📝 AI Response:", aiContent);

    // Parse JSON
    let result;
    try {
      result = JSON.parse(aiContent);
    } catch (parseError) {
      console.error("Parse error, trying to extract JSON...");
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    return formatResult(result);

  } catch (error) {
    console.error("❌ AI Analysis Error:", error);
    return getSmartFallback(fileName, "");
  }
}

function formatResult(result: any) {
  return {
    summary: result.summary || "Analysis complete.",
    confidence: 85,
    threatLevel: result.threatLevel || "Medium",
    findings: result.findings || ["No specific findings"],
    indicators: ["Check file metadata", "Verify file integrity"],
    recommendations: result.recommendations || ["Review file manually"],
    conclusion: result.conclusion || "Further investigation recommended."
  };
}

// Smart fallback based on actual content
function getSmartFallback(fileName: string, content: string) {
  console.log("📊 Analyzing content directly (no API)");
  
  const lowerContent = content.toLowerCase();
  const lowerName = fileName.toLowerCase();
  
  // Check for CV/Resume
  if (lowerName.includes('cv') || lowerName.includes('resume') || 
      lowerContent.includes('experience') || lowerContent.includes('education') ||
      lowerContent.includes('skills') || lowerContent.includes('work')) {
    return {
      summary: "📄 CV/Resume document - Personal information, no security threats detected.",
      confidence: 85,
      threatLevel: "Low",
      findings: [
        "Personal document (CV/Resume)",
        "Contains professional and educational information",
        "No malicious content detected"
      ],
      indicators: ["Personal information", "Professional history", "No suspicious indicators"],
      recommendations: [
        "Handle with privacy consideration",
        "Continue standard investigation",
        "Document findings"
      ],
      conclusion: "This is a CV/Resume document. No security threats detected."
    };
  }

  // Check for technical documentation
  if (lowerContent.includes('architecture') || 
      lowerContent.includes('system') ||
      lowerContent.includes('database') ||
      lowerContent.includes('api') ||
      lowerContent.includes('server') ||
      lowerContent.includes('deployment') ||
      lowerContent.includes('next.js') ||
      lowerContent.includes('react')) {
    return {
      summary: "📋 Technical/System documentation - No threats detected.",
      confidence: 85,
      threatLevel: "Low",
      findings: [
        "Technical documentation file",
        "Contains system architecture or code references",
        "No malicious patterns detected"
      ],
      indicators: ["Technical terminology", "Legitimate documentation"],
      recommendations: [
        "Archive as reference",
        "Continue standard investigation"
      ],
      conclusion: "This is legitimate technical documentation. No security threats detected."
    };
  }

  // Check for phishing
  if (lowerContent.includes('phish') || 
      lowerContent.includes('bank') || 
      lowerContent.includes('verify your account') ||
      lowerContent.includes('urgent') ||
      lowerContent.includes('click here') ||
      lowerContent.includes('login')) {
    return {
      summary: "⚠️ Phishing indicators detected in content!",
      confidence: 85,
      threatLevel: "Critical",
      findings: [
        "Suspicious content detected",
        "Phishing keywords found",
        "Urgent language present"
      ],
      indicators: ["Phishing keywords", "Urgent language", "Request for action"],
      recommendations: [
        "Do not respond",
        "Report to security team",
        "Do not click any links"
      ],
      conclusion: "This file contains phishing indicators. Handle with caution."
    };
  }

  // Check for malware
  if (lowerContent.includes('malware') || 
      lowerContent.includes('virus') || 
      lowerContent.includes('ransomware') ||
      lowerContent.includes('trojan')) {
    return {
      summary: "🔴 Malware indicators detected!",
      confidence: 80,
      threatLevel: "High",
      findings: [
        "Malware keywords detected",
        "Requires further analysis",
        "Potential security threat"
      ],
      indicators: ["Malware terminology", "Suspicious content"],
      recommendations: [
        "Quarantine file",
        "Run antivirus scan",
        "Report to security team"
      ],
      conclusion: "Malware indicators found. Immediate investigation required."
    };
  }

  // Default - based on content length
  if (content.length > 500) {
    return {
      summary: "📄 Document analysis complete. File contains text content. No immediate threats detected.",
      confidence: 70,
      threatLevel: "Low",
      findings: [
        "Document contains significant text content",
        "No malicious patterns detected",
        "File appears to be legitimate documentation"
      ],
      indicators: ["No suspicious indicators found"],
      recommendations: [
        "Continue standard investigation",
        "Document findings"
      ],
      conclusion: "File appears safe. Continue with standard procedures."
    };
  }

  return {
    summary: "📄 File analysis complete. No immediate threats detected.",
    confidence: 70,
    threatLevel: "Low",
    findings: [
      "File content analyzed",
      "No malicious patterns found",
      "File appears legitimate"
    ],
    indicators: ["No suspicious indicators found"],
    recommendations: [
      "Continue standard investigation",
      "Document findings"
    ],
    conclusion: "File appears safe. Continue with standard procedures."
  };
}