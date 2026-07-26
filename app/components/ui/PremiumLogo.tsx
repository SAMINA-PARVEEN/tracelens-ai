"use client";

interface PremiumLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "full" | "icon" | "white";
  className?: string;
  showTagline?: boolean;
}

export default function PremiumLogo({
  size = "md",
  variant = "full",
  className = "",
  showTagline = true,
}: PremiumLogoProps) {

  const sizes = {
    sm: { icon: 28, text: "text-sm", subtext: "text-[8px]", tagline: "text-[6px]", gap: "gap-1.5" },
    md: { icon: 38, text: "text-xl", subtext: "text-[10px]", tagline: "text-[8px]", gap: "gap-2" },
    lg: { icon: 48, text: "text-2xl", subtext: "text-xs", tagline: "text-[10px]", gap: "gap-2.5" },
    xl: { icon: 60, text: "text-4xl", subtext: "text-sm", tagline: "text-xs", gap: "gap-3" },
    "2xl": { icon: 76, text: "text-5xl", subtext: "text-base", tagline: "text-sm", gap: "gap-4" },
  };

  const current = sizes[size];
  const isWhite = variant === "white";

  // Logo Icon
  const LogoIcon = ({ size: iconSize = current.icon }) => (
    <div 
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: iconSize, height: iconSize }}
    >
      <svg
        width={iconSize * 0.95}
        height={iconSize * 0.95}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Hexagon */}
        <polygon
          points="60 8 108 34 108 86 60 112 12 86 12 34"
          stroke={isWhite ? "#FFFFFF" : "#3B82F6"}
          strokeWidth="3"
          fill="none"
          className={isWhite ? "stroke-white" : "stroke-[#3B82F6]"}
          opacity="0.3"
        />

        {/* Inner Circle */}
        <circle
          cx="60"
          cy="60"
          r="32"
          stroke={isWhite ? "#FFFFFF" : "#3B82F6"}
          strokeWidth="2.5"
          fill="none"
          className={isWhite ? "stroke-white" : "stroke-[#3B82F6]"}
        />

        {/* Pupil/Scanner Dot */}
        <circle
          cx="60"
          cy="60"
          r="8"
          fill={isWhite ? "#FFFFFF" : "#3B82F6"}
          className={isWhite ? "fill-white" : "fill-[#3B82F6]"}
        />

        {/* Lens Flare */}
        <circle
          cx="48"
          cy="48"
          r="4"
          fill="rgba(255,255,255,0.2)"
          className="fill-white/20"
        />

        {/* AI Circuit Lines */}
        <path
          d="M60 28 L60 20 L68 20"
          stroke={isWhite ? "#FFFFFF" : "#8B5CF6"}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isWhite ? "stroke-white" : "stroke-[#8B5CF6]"}
        />
        <circle cx="68" cy="20" r="3" fill={isWhite ? "#FFFFFF" : "#8B5CF6"} className={isWhite ? "fill-white" : "fill-[#8B5CF6]"} />

        <path
          d="M92 60 L100 60 L100 52"
          stroke={isWhite ? "#FFFFFF" : "#8B5CF6"}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isWhite ? "stroke-white" : "stroke-[#8B5CF6]"}
        />
        <circle cx="100" cy="52" r="3" fill={isWhite ? "#FFFFFF" : "#8B5CF6"} className={isWhite ? "fill-white" : "fill-[#8B5CF6]"} />

        <path
          d="M60 92 L60 100 L52 100"
          stroke={isWhite ? "#FFFFFF" : "#8B5CF6"}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isWhite ? "stroke-white" : "stroke-[#8B5CF6]"}
        />
        <circle cx="52" cy="100" r="3" fill={isWhite ? "#FFFFFF" : "#8B5CF6"} className={isWhite ? "fill-white" : "fill-[#8B5CF6]"} />

        <path
          d="M28 60 L20 60 L20 68"
          stroke={isWhite ? "#FFFFFF" : "#8B5CF6"}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isWhite ? "stroke-white" : "stroke-[#8B5CF6]"}
        />
        <circle cx="20" cy="68" r="3" fill={isWhite ? "#FFFFFF" : "#8B5CF6"} className={isWhite ? "fill-white" : "fill-[#8B5CF6]"} />

        {/* Scan lines */}
        <line x1="40" y1="52" x2="52" y2="52" stroke={isWhite ? "#FFFFFF" : "#3B82F6"} strokeWidth="1.5" strokeLinecap="round" className={isWhite ? "stroke-white" : "stroke-[#3B82F6]"} opacity="0.4" />
        <line x1="40" y1="60" x2="56" y2="60" stroke={isWhite ? "#FFFFFF" : "#3B82F6"} strokeWidth="1.5" strokeLinecap="round" className={isWhite ? "stroke-white" : "stroke-[#3B82F6]"} opacity="0.4" />
        <line x1="40" y1="68" x2="52" y2="68" stroke={isWhite ? "#FFFFFF" : "#3B82F6"} strokeWidth="1.5" strokeLinecap="round" className={isWhite ? "stroke-white" : "stroke-[#3B82F6]"} opacity="0.4" />
      </svg>
    </div>
  );

  // Icon Only
  if (variant === "icon") {
    return <LogoIcon />;
  }

  // WHITE VERSION
  if (isWhite) {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex items-center">
          <LogoIcon />
          <div className="flex items-center ml-2">
            <span className={`${current.text} font-bold tracking-tight text-white`}>
              TraceLens
            </span>
            <span className={`${current.text} font-bold tracking-tight text-white ml-1`}>
              AI
            </span>
            <span className={`${current.subtext} font-medium tracking-[3px] uppercase text-white/40 ml-2`}>
              by SamiNova
            </span>
          </div>
        </div>
        {showTagline && (
          <div className="flex items-center mt-0.5 ml-[48px]">
            <span className={`${current.tagline} text-[#3B82F6] mr-1.5`}>●</span>
            <span className={`${current.tagline} font-medium tracking-[2px] uppercase text-white/40`}>
              AI-Powered Digital Investigation
            </span>
          </div>
        )}
      </div>
    );
  }

  // FULL VERSION (Default - Colorful "AI")
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center">
        <LogoIcon />
        <div className="flex items-center ml-2">
          <span className={`${current.text} font-bold tracking-tight text-white`}>
            TraceLens
          </span>
          <span className={`${current.text} font-bold tracking-tight bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent ml-1`}>
            AI
          </span>
          <span className={`${current.subtext} font-medium tracking-[3px] uppercase text-gray-400 ml-2`}>
            by SamiNova
          </span>
        </div>
      </div>
      {showTagline && (
        <div className="flex items-center mt-0.5 ml-[48px]">
          <span className={`${current.tagline} text-[#3B82F6] mr-1.5`}>●</span>
          <span className={`${current.tagline} font-medium tracking-[2px] uppercase text-[#8B5CF6]`}>
            AI-Powered Digital Investigation
          </span>
        </div>
      )}
    </div>
  );
}