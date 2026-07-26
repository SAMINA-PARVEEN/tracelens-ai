import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  
  return NextResponse.json({
    hasKey: !!apiKey,
    keyStart: apiKey ? apiKey.substring(0, 15) + '...' : 'not found',
    keyLength: apiKey ? apiKey.length : 0,
    message: apiKey ? '✅ API key found!' : '❌ No API key found in .env.local'
  });
}