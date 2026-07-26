"use client";

import { useState } from "react";
import Link from "next/link";
import PremiumLogo from "../components/ui/PremiumLogo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/dashboard";
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <PremiumLogo size="lg" variant="white" />
            <h1 className="text-2xl font-bold text-white mt-6">Welcome Back</h1>
            <p className="text-gray-400 mt-1">Sign in to your account to continue</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#1A2332] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <a href="#" className="text-sm text-[#3B82F6] hover:text-[#60A5FA] font-medium transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1A2332] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 bg-[#1A2332] border-[#2A3A4A] rounded focus:ring-[#3B82F6] text-[#3B82F6]"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-400">
                  Remember me
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-[#3B82F6] hover:text-[#60A5FA] font-medium transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Brand Section */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#0B1220] to-[#1A2332] items-center justify-center p-12 border-l border-[#1E293B]">
        <div className="max-w-md text-center">
          <PremiumLogo size="2xl" variant="white" />
          <div className="mt-8 space-y-6">
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">24</p>
                <p className="text-sm text-gray-500">Active Cases</p>
              </div>
              <div className="w-px bg-[#1E293B]"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">89</p>
                <p className="text-sm text-gray-500">AI Analyses</p>
              </div>
              <div className="w-px bg-[#1E293B]"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">156</p>
                <p className="text-sm text-gray-500">Evidence Files</p>
              </div>
            </div>
            <div className="p-4 bg-[#1A2332] rounded-xl border border-[#1E293B]">
              <p className="text-sm text-gray-400">
                🔒 Secure • AI-Powered • Professional
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}