"use client";

import { useState } from "react";

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Test 1: Check API Key
  const testAPIKey = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-key');
      const data = await response.json();
      setResult(data);
    } catch (e) {
      setResult({ error: String(e) });
    }
    setLoading(false);
  };

  // Test 2: Test AI Call
  const testAICall = async () => {
    setAiLoading(true);
    try {
      const response = await fetch('/api/test-ai');
      const data = await response.json();
      setAiResult(data);
    } catch (e) {
      setAiResult({ error: String(e) });
    }
    setAiLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-white p-8">
      <h1 className="text-3xl font-bold mb-6">🧪 API Test Page</h1>
      
      {/* Test 1: API Key */}
      <div className="bg-[#1A2332] p-6 rounded-xl border border-[#1E293B] mb-6">
        <h2 className="text-xl font-semibold mb-4">Test 1: Check API Key</h2>
        <button 
          onClick={testAPIKey}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Checking..." : "Check API Key"}
        </button>
        {result && (
          <pre className="mt-4 p-4 bg-[#0B1220] rounded-lg border border-[#1E293B] overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>

      {/* Test 2: AI Call */}
      <div className="bg-[#1A2332] p-6 rounded-xl border border-[#1E293B]">
        <h2 className="text-xl font-semibold mb-4">Test 2: Call OpenRouter AI</h2>
        <button 
          onClick={testAICall}
          className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
          disabled={aiLoading}
        >
          {aiLoading ? "Calling AI..." : "Test AI Call"}
        </button>
        {aiResult && (
          <pre className="mt-4 p-4 bg-[#0B1220] rounded-lg border border-[#1E293B] overflow-auto">
            {JSON.stringify(aiResult, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}