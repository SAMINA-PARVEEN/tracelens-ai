import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get cases first
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('case_id')
      .limit(5);
    
    if (casesError) {
      return NextResponse.json({ error: casesError }, { status: 500 });
    }
    
    // Try to insert test evidence
    const firstCaseId = cases?.[0]?.case_id;
    
    if (!firstCaseId) {
      return NextResponse.json({ error: 'No cases found' }, { status: 404 });
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('evidence')
      .insert({
        evidence_id: `TEST-${Date.now().toString().slice(-6)}`,
        case_id: firstCaseId,
        file_name: 'test_from_api.txt'
      })
      .select();
    
    return NextResponse.json({
      cases,
      insertData,
      insertError,
      firstCaseId,
      success: !insertError
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}