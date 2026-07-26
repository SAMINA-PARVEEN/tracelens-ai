"use client";

import { useState } from "react";
import Link from "next/link";
import PremiumLogo from "../components/ui/PremiumLogo";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Password validation rules
  const validatePassword = (pwd: string) => {
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    setPasswordStrength(validatePassword(pwd));
    if (confirmPassword) {
      setPasswordsMatch(pwd === confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (pwd: string) => {
    setConfirmPassword(pwd);
    setPasswordsMatch(password === pwd);
  };

  const isPasswordValid = () => {
    const { length, uppercase, lowercase, number, special } = passwordStrength;
    return length && uppercase && lowercase && number && special;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid()) {
      alert("Please meet all password requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordsMatch(false);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/login";
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] flex">
      {/* Left Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <PremiumLogo size="lg" variant="white" />
            <h1 className="text-2xl font-bold text-white mt-6">Create Account</h1>
            <p className="text-gray-400 mt-1">Start your digital investigation journey</p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#1A2332] border border-[#2A3A4A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                placeholder="Samina Parveen"
                required
              />
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
                <span className="text-gray-500 text-xs ml-2">(Must be strong)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`w-full px-4 py-3 bg-[#1A2332] border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all pr-12 ${
                    password && isPasswordValid()
                      ? "border-green-500/50"
                      : password && !isPasswordValid()
                      ? "border-red-500/50"
                      : "border-[#2A3A4A]"
                  }`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Requirements Checklist */}
              {password && (
                <div className="mt-3 space-y-1.5 bg-[#1A2332] rounded-xl p-4 border border-[#2A3A4A]">
                  <p className="text-xs font-medium text-gray-400 mb-2">Password Requirements:</p>
                  {[
                    { key: "length", label: "At least 8 characters" },
                    { key: "uppercase", label: "One uppercase letter (A-Z)" },
                    { key: "lowercase", label: "One lowercase letter (a-z)" },
                    { key: "number", label: "One number (0-9)" },
                    { key: "special", label: "One special character (!@#$%^&*)" },
                  ].map((req) => (
                    <div key={req.key} className="flex items-center text-xs">
                      <span
                        className={`mr-2 ${
                          passwordStrength[req.key as keyof typeof passwordStrength]
                            ? "text-green-400"
                            : "text-gray-500"
                        }`}
                      >
                        {passwordStrength[req.key as keyof typeof passwordStrength] ? "✓" : "○"}
                      </span>
                      <span
                        className={
                          passwordStrength[req.key as keyof typeof passwordStrength]
                            ? "text-green-400"
                            : "text-gray-500"
                        }
                      >
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                className={`w-full px-4 py-3 bg-[#1A2332] border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all ${
                  confirmPassword && !passwordsMatch
                    ? "border-red-500/50"
                    : confirmPassword && passwordsMatch
                    ? "border-green-500/50"
                    : "border-[#2A3A4A]"
                }`}
                placeholder="••••••••"
                required
              />
              {confirmPassword && !passwordsMatch && (
                <p className="mt-2 text-xs text-red-400">✗ Passwords do not match</p>
              )}
              {confirmPassword && passwordsMatch && (
                <p className="mt-2 text-xs text-green-400">✓ Passwords match</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 bg-[#1A2332] border-[#2A3A4A] rounded focus:ring-[#3B82F6] text-[#3B82F6]"
                required
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-400">
                I agree to the{" "}
                <a href="#" className="text-[#3B82F6] hover:text-[#60A5FA]">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#3B82F6] hover:text-[#60A5FA]">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid() || password !== confirmPassword || !password}
              className="w-full py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#3B82F6] hover:text-[#60A5FA] font-medium transition-colors">
              Sign in
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
              <p className="text-sm text-gray-400">🔒 Secure • AI-Powered • Professional</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}