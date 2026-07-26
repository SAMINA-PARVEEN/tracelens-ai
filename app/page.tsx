"use client";

import Link from "next/link";
import PremiumLogo from "./components/ui/PremiumLogo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B1220]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1E293B] z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <PremiumLogo size="lg" variant="white" />
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#about" className="text-sm text-gray-400 hover:text-white transition-colors">About</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="hidden sm:inline-block text-sm text-gray-400 hover:text-white transition-colors">Sign In</Link>
              <Link href="/register" className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-1.5 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-full mb-6">
                <span className="w-2 h-2 bg-[#3B82F6] rounded-full mr-2.5 animate-pulse"></span>
                <span className="text-xs font-medium text-[#3B82F6]">AI-Powered Investigation Platform</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Digital Investigation
                <span className="block bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] bg-clip-text text-transparent">Powered by AI</span>
              </h1>
              <p className="mt-6 text-lg text-gray-400 max-w-lg leading-relaxed">
                Streamline your digital investigations with AI-powered evidence analysis, metadata extraction, and professional reporting—all in one platform.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/register" className="px-8 py-3.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all">Start Free Trial</Link>
                <a href="#features" className="px-8 py-3.5 bg-[#1E293B] border border-[#334155] text-gray-300 font-medium rounded-xl hover:bg-[#334155] transition-all">Learn More</a>
              </div>
              <div className="mt-10 flex items-center space-x-6">
                <div className="flex -space-x-3">
                  {["S", "A", "M", "I"].map((letter, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-[#1E293B] border-2 border-[#0B1220] flex items-center justify-center text-xs font-semibold text-gray-400">{letter}</div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Trusted by investigators</p>
                  <p className="text-xs text-gray-500">500+ users worldwide</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/20 to-[#8B5CF6]/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-[#1A2332] rounded-2xl shadow-2xl border border-[#2A3A4A] p-6">
                <div className="flex items-center justify-between mb-4">
                  <PremiumLogo size="sm" variant="white" />
                  <span className="text-xs text-green-400 bg-green-500/20 px-2.5 py-1 rounded-full border border-green-500/30">● Live</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0B1220] rounded-xl p-4 border border-[#1E293B]">
                    <p className="text-xs text-gray-400">Active Cases</p>
                    <p className="text-2xl font-bold text-white">24</p>
                    <p className="text-xs text-green-400">↑ 12%</p>
                  </div>
                  <div className="bg-[#0B1220] rounded-xl p-4 border border-[#1E293B]">
                    <p className="text-xs text-gray-400">AI Analyses</p>
                    <p className="text-2xl font-bold text-white">89</p>
                    <p className="text-xs text-green-400">↑ 23%</p>
                  </div>
                  <div className="bg-[#0B1220] rounded-xl p-4 border border-[#1E293B]">
                    <p className="text-xs text-gray-400">Evidence Files</p>
                    <p className="text-2xl font-bold text-white">156</p>
                    <p className="text-xs text-[#3B82F6]">↑ 8%</p>
                  </div>
                  <div className="bg-[#0B1220] rounded-xl p-4 border border-[#1E293B]">
                    <p className="text-xs text-gray-400">Reports</p>
                    <p className="text-2xl font-bold text-white">18</p>
                    <p className="text-xs text-[#3B82F6]">↑ 5%</p>
                  </div>
                </div>
                <div className="mt-4 bg-gradient-to-r from-[#3B82F6]/10 to-[#8B5CF6]/10 rounded-xl p-4 border border-[#3B82F6]/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-sm font-medium text-white">AI Assistant Online</p>
                      <p className="text-xs text-gray-400">Ready to analyze evidence</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[#0A0F1A]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <div className="inline-flex items-center px-4 py-1.5 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-full mb-4">
              <span className="text-xs font-medium text-[#3B82F6]">Features</span>
            </div>
            <h2 className="text-3xl font-bold text-white">Complete Investigation Platform</h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">Everything you need for professional digital investigations in one place</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "🔍", title: "Evidence Management", desc: "Upload, organize, and verify digital evidence with SHA-256 hashing" },
              { icon: "🤖", title: "AI Analysis", desc: "AI-powered log analysis, email analysis, and OSINT investigations" },
              { icon: "📊", title: "Metadata Extraction", desc: "Extract and analyze metadata from images, documents, and files" },
              { icon: "⏱️", title: "Timeline Reconstruction", desc: "AI-assisted chronological timeline of investigation events" },
              { icon: "📋", title: "Professional Reports", desc: "Generate comprehensive PDF reports with all findings" },
              { icon: "🛡️", title: "Incident Response", desc: "AI-generated incident response guidance and action plans" },
            ].map((feature, index) => (
              <div key={index} className="bg-[#1A2332] rounded-xl p-6 border border-[#1E293B] hover:border-[#3B82F6]/30 hover:shadow-lg hover:shadow-[#3B82F6]/5 transition-all group">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-[#0B1220]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-1.5 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-full mb-4">
                <span className="text-xs font-medium text-[#3B82F6]">About TraceLens AI</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Built for Modern Digital Investigations</h2>
              <p className="mt-4 text-gray-400 leading-relaxed">TraceLens AI combines digital forensics, incident response, and AI-powered analysis into a single platform.</p>
              <div className="mt-6 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
                    <span className="text-green-400 text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-300">AI-powered evidence analysis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
                    <span className="text-green-400 text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-300">Secure evidence management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
                    <span className="text-green-400 text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-300">Professional PDF reporting</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1A2332] rounded-xl p-6 text-center border border-[#1E293B]">
                <p className="text-3xl font-bold text-[#3B82F6]">500+</p>
                <p className="text-sm text-gray-500">Active Users</p>
              </div>
              <div className="bg-[#1A2332] rounded-xl p-6 text-center border border-[#1E293B]">
                <p className="text-3xl font-bold text-[#3B82F6]">1,200+</p>
                <p className="text-sm text-gray-500">Investigations</p>
              </div>
              <div className="bg-[#1A2332] rounded-xl p-6 text-center border border-[#1E293B]">
                <p className="text-3xl font-bold text-[#3B82F6]">98%</p>
                <p className="text-sm text-gray-500">Satisfaction Rate</p>
              </div>
              <div className="bg-[#1A2332] rounded-xl p-6 text-center border border-[#1E293B]">
                <p className="text-3xl font-bold text-[#3B82F6]">24/7</p>
                <p className="text-sm text-gray-500">AI Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A0F1A] border-t border-[#1E293B] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <PremiumLogo size="sm" variant="white" />
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Privacy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Terms</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Support</a>
              <span className="text-sm text-gray-600">© 2026 SamiNova</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}