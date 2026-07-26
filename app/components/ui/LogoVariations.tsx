"use client";

import Logo from "./Logo";

export default function LogoVariations() {
  return (
    <div className="bg-[#0B1220] p-8 rounded-2xl border border-[#1E293B]">
      <h3 className="text-sm font-medium text-gray-400 mb-6 uppercase tracking-wider">
        Logo Variations
      </h3>
      
      <div className="space-y-6">
        {/* Full Color */}
        <div className="flex items-center justify-between p-4 bg-[#1A2332] rounded-xl border border-[#1E293B]">
          <span className="text-xs text-gray-500 w-24">Full Color</span>
          <Logo size="lg" variant="fullcolor" />
        </div>

        {/* Monochrome */}
        <div className="flex items-center justify-between p-4 bg-[#1A2332] rounded-xl border border-[#1E293B]">
          <span className="text-xs text-gray-500 w-24">Monochrome</span>
          <Logo size="lg" variant="monochrome" />
        </div>

        {/* Icon Only */}
        <div className="flex items-center justify-between p-4 bg-[#1A2332] rounded-xl border border-[#1E293B]">
          <span className="text-xs text-gray-500 w-24">Icon Only</span>
          <Logo size="lg" variant="icononly" />
        </div>
      </div>
    </div>
  );
}