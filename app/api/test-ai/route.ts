import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: '❌ No API key found in .env.local',
      tip: 'Add NEXT_PUBLIC_OPENROUTER_API_KEY=your-key-here to .env.local'
    }, { status: 400 });
  }

  try {
    console.log('🔑 Using API key:', apiKey.substring(0, 15) + '...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://tracelens.ai',
        'X-Title': 'TraceLens AI Test',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Respond with valid JSON only.'
          },
          {
            role: 'user',
            content: 'Respond with this JSON: {"status": "success", "message": "AI is working!", "timestamp": "now"}'
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
      })
    });

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      status: response.status,
      data: data
    });

  } catch (error: any) {
    console.error('❌ AI Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
}