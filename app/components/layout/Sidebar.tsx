"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiFolder,
  FiFile,
  FiTag,
  FiBarChart2,
  FiMail,
  FiSearch,
  FiClock,
  FiShield,
  FiFileText,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import SidebarLogo from "./SidebarLogo";  // <-- NEW IMPORT

const menuItems = [
  { name: "Dashboard", icon: FiHome, href: "/dashboard" },
  { name: "Cases", icon: FiFolder, href: "/cases" },
  { name: "Evidence", icon: FiFile, href: "/evidence" },
  { name: "Metadata", icon: FiTag, href: "/metadata" },
  { name: "Log Analysis", icon: FiBarChart2, href: "/log-analysis" },
  { name: "Email Analysis", icon: FiMail, href: "/email-analysis" },
  { name: "OSINT", icon: FiSearch, href: "/osint" },
  { name: "Timeline", icon: FiClock, href: "/timeline" },
  { name: "Incident Response", icon: FiShield, href: "/incident-response" },
  { name: "Reports", icon: FiFileText, href: "/reports" },
  { name: "Settings", icon: FiSettings, href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0B1220] border-r border-[#1E293B] h-screen sticky top-0 overflow-y-auto flex-shrink-0">
      <div className="p-4">
        {/* ===== SIDEBAR LOGO - SMALL, NO TAGLINE ===== */}
        <div className="mb-6">
          <SidebarLogo size="sm" />
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-[#3B82F6]/10 text-[#3B82F6]"
                    : "text-gray-400 hover:text-white hover:bg-[#1A2332]"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-[#1E293B] mt-6 pt-4">
          <button
            onClick={() => {
              window.location.href = "/login";
            }}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1A2332] w-full transition-all"
          >
            <FiLogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}