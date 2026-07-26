import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { case_id, file_name, file_type, file_size, hash_sha256, description } = body;

    console.log('📤 API: Uploading evidence...');

    if (!case_id || !file_name) {
      return NextResponse.json(
        { error: 'Missing required fields: case_id and file_name' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Try to get a profile
    let uploadedBy = null;
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (profileData && profileData.length > 0) {
        uploadedBy = profileData[0].id;
      }
    } catch (err) {
      console.log('⚠️ No profile found');
    }

    const insertData: any = {
      evidence_id: `E-${Date.now().toString().slice(-6)}`,
      case_id: case_id,
      file_name: file_name,
      file_type: file_type || null,
      file_size: file_size || null,
      hash_sha256: hash_sha256 || null,
      description: description || `Uploaded via TraceLens AI`,
    };

    if (uploadedBy) {
      insertData.uploaded_by = uploadedBy;
    }

    console.log('📝 Inserting:', insertData);

    const { data, error } = await supabase
      .from('evidence')
      .insert([insertData])
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Upload success:', data);
    return NextResponse.json({ success: true, data: data[0] }, { status: 200 });

  } catch (error: any) {
    console.error('🔥 Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}