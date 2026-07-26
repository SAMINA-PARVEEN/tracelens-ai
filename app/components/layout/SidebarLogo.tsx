"use client";

import PremiumLogo from "../ui/PremiumLogo";

interface SidebarLogoProps {
  className?: string;
}

export default function SidebarLogo({ className = "" }: SidebarLogoProps) {
  return (
    <div className={`flex items-start ${className}`}>
      {/* YOUR EXACT LOGO - on the LEFT */}
      <PremiumLogo size="md" variant="icon" />
      
      {/* TEXT - on the RIGHT of logo */}
      <div className="ml-3 flex flex-col">
        <div className="flex items-baseline">
          <span className="text-xl font-bold text-white tracking-tight">
            TraceLens
          </span>
          <span className="text-xl font-bold text-white tracking-tight ml-1">
            AI
          </span>
        </div>
        <div>
          <span className="text-[10px] font-medium tracking-[5px] uppercase text-white/50">
            by SamiNova
          </span>
        </div>
      </div>
    </div>
  );
}