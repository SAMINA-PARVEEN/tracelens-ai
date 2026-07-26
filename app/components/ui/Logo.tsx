"use client";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "fullcolor" | "monochrome" | "icononly";
}

export default function Logo({ 
  size = "md", 
  showText = true,
  variant = "fullcolor"
}: LogoProps) {
  
  const sizes = {
    sm: { icon: "w-7 h-7", text: "text-sm", subtext: "text-[8px]", gap: "gap-1.5" },
    md: { icon: "w-9 h-9", text: "text-xl", subtext: "text-[10px]", gap: "gap-2" },
    lg: { icon: "w-12 h-12", text: "text-2xl", subtext: "text-xs", gap: "gap-3" },
    xl: { icon: "w-16 h-16", text: "text-4xl", subtext: "text-sm", gap: "gap-4" },
  };

  const current = sizes[size];

  // Colors based on variant
  const getColors = () => {
    if (variant === "monochrome") {
      return {
        iconBg: "bg-white",
        iconColor: "text-[#0B1220]",
        brand: "text-white",
        ai: "text-white",
        by: "text-gray-400",
        sami: "text-gray-300",
      };
    }
    if (variant === "icononly") {
      return {
        iconBg: "bg-gradient-to-br from-[#3B82F6] via-[#8B5CF6] to-[#D946EF]",
        iconColor: "text-white",
        brand: "text-white",
        ai: "text-[#8B5CF6]",
        by: "text-gray-500",
        sami: "text-gray-400",
      };
    }
    // Full color (default)
    return {
      iconBg: "bg-gradient-to-br from-[#3B82F6] via-[#8B5CF6] to-[#D946EF]",
      iconColor: "text-white",
      brand: "text-white",
      ai: "text-[#8B5CF6]",
      by: "text-gray-500",
      sami: "text-gray-400",
    };
  };

  const colors = getColors();

  // Icon only mode
  if (variant === "icononly" || !showText) {
    return (
      <div className="flex items-center">
        <div className={`${current.icon} ${colors.iconBg} rounded-xl flex items-center justify-center shadow-lg shadow-[#3B82F6]/25 relative`}>
          {/* Shield Icon */}
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
      </div>
    );
  }

  return (
    <div className={`flex items-center ${current.gap}`}>
      {/* Logo Icon with Shield */}
      <div className={`${current.icon} ${colors.iconBg} rounded-xl flex items-center justify-center shadow-lg shadow-[#3B82F6]/25 relative flex-shrink-0`}>
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

      {/* Text Section */}
      <div className="flex flex-col">
        <div className="flex items-baseline">
          <span className={`${current.text} font-bold ${colors.brand}`}>
            TraceLens
          </span>
          <span className={`${current.text} font-bold ${colors.ai} ml-1`}>
            AI
          </span>
          <span className={`${current.subtext} font-medium ${colors.by} ml-1.5`}>
            BY
          </span>
          <span className={`${current.subtext} font-semibold ${colors.sami} ml-1`}>
            SAMI
          </span>
        </div>
        {size === "lg" || size === "xl" ? (
          <p className="text-[10px] text-gray-500 tracking-wider uppercase mt-0.5">
            Digital Investigation Platform
          </p>
        ) : null}
      </div>
    </div>
  );
}