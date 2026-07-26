"use client";

import { useState } from "react";
import Link from "next/link";
import PremiumLogo from "../components/ui/PremiumLogo";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  const settingsTabs = [
    { id: "profile", label: "Profile" },
    { id: "security", label: "Security" },
    { id: "preferences", label: "Preferences" },
    { id: "api", label: "API Settings" },
  ];

  return (
    <div className="min-h-screen bg-[#0B1220]">
      <nav className="bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1E293B] px-6 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <PremiumLogo size="md" variant="white" />
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 pl-4 border-l border-[#1E293B]">
              <div className="w-8 h-8 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">S</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Samina</p>
                <p className="text-xs text-gray-500">Investigator</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400">Manage your account and application preferences</p>
        </div>

        <div className="bg-[#1A2332] rounded-xl border border-[#1E293B]">
          {/* Tabs */}
          <div className="border-b border-[#1E293B] px-6 pt-4">
            <div className="flex space-x-6 overflow-x-auto">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "text-[#3B82F6] border-[#3B82F6]"
                      : "text-gray-500 border-transparent hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    defaultValue="Samina Parveen"
                    className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue="samina@tracelens.ai"
                    className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  />
                </div>
                <button className="px-6 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all">
                  Update Profile
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  />
                </div>
                <button className="px-6 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all">
                  Change Password
                </button>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                  <div>
                    <p className="text-sm text-white">Dark Mode</p>
                    <p className="text-xs text-gray-500">Enable dark theme for the application</p>
                  </div>
                  <div className="w-12 h-6 bg-[#3B82F6] rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                  <div>
                    <p className="text-sm text-white">AI Auto-Analysis</p>
                    <p className="text-xs text-gray-500">Automatically analyze uploaded evidence</p>
                  </div>
                  <div className="w-12 h-6 bg-[#2A3A4A] rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                  <div>
                    <p className="text-sm text-white">Email Notifications</p>
                    <p className="text-xs text-gray-500">Receive notifications via email</p>
                  </div>
                  <div className="w-12 h-6 bg-[#2A3A4A] rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                  </div>
                </div>
              </div>
            )}

            {/* API Settings Tab */}
            {activeTab === "api" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">API Key Status</label>
                  <div className="p-4 bg-green-500/20 rounded-xl border border-green-500/30">
                    <p className="text-sm text-green-400">✓ API Key Configured</p>
                    <p className="text-xs text-gray-400 mt-1">OpenRouter API is active and ready</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">AI Model</label>
                  <select className="w-full px-4 py-3 bg-[#0B1220] border border-[#2A3A4A] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all">
                    <option>deepseek/deepseek-chat-v3-0324:free</option>
                    <option>google/gemini-2.0-flash-exp:free</option>
                    <option>mistralai/mistral-7b-instruct:free</option>
                  </select>
                </div>
                <button className="px-6 py-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all">
                  Save API Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}