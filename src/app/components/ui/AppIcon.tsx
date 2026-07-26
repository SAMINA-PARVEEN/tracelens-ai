"use client";

interface AppIconProps {
  size?: number;
  className?: string;
}

export default function AppIcon({ size = 48, className = "" }: AppIconProps) {
  return (
    <div 
      className={`bg-gradient-to-br from-[#3B82F6] via-[#8B5CF6] to-[#D946EF] rounded-2xl flex items-center justify-center shadow-lg shadow-[#3B82F6]/30 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        className="w-1/2 h-1/2 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    </div>
  );
}