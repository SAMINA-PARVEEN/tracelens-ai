"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js'

export default function TestDBPage() {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string>("");

  useEffect(() => {
    async function testConnection() {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!url) {
          setStatus("error");
          setError("Missing NEXT_PUBLIC_SUPABASE_URL");
          return;
        }
        
        if (!key) {
          setStatus("error");
          setError("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
          return;
        }

        // Log for debugging
        console.log("Supabase URL:", url);
        console.log("Supabase Key:", key.substring(0, 10) + "...");

        const supabase = createClient(url, key);
        
        // Try a simple query with timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Connection timeout - Supabase may be unreachable")), 10000);
        });
        
        const queryPromise = supabase.from("cases").select("count");
        
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;
        
        if (result.error) {
          setStatus("error");
          setError(result.error.message);
          setDetails("Table 'cases' may not exist. Please run the SQL script.");
          return;
        }
        
        setStatus("connected");
        setDetails(`✅ Found ${result.data?.[0]?.count || 0} cases in database`);
        
      } catch (err: any) {
        setStatus("error");
        setError(err.message || "Connection failed");
        setDetails("Check: 1) Internet connection 2) Supabase is running 3) Credentials are correct");
      }
    }
    
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1220] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B] p-6">
          <h1 className="text-2xl font-bold text-white mb-4">Database Connection Test</h1>
          
          <div className="mb-6 p-4 rounded-lg border">
            <h2 className="text-sm font-semibold text-gray-400 mb-2">Connection Status</h2>
            {status === "loading" && <div className="text-yellow-400">⏳ Connecting to Supabase... (may take a few seconds)</div>}
            {status === "connected" && <div className="text-green-400">✅ Connected to Supabase successfully!</div>}
            {status === "error" && <div className="text-red-400">❌ {error}</div>}
          </div>
          
          {details && (
            <div className="p-4 bg-[#0B1220] rounded-lg">
              <p className="text-sm text-gray-400">{details}</p>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-[#0B1220] rounded-lg space-y-1">
            <p className="text-xs text-gray-500">Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}</p>
            <p className="text-xs text-gray-500">Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}</p>
            <p className="text-xs text-gray-500">Status: {status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}