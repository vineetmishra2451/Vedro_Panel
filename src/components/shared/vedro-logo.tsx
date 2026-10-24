import React from "react";

interface VedroLogoProps {
  variant?: "dark" | "light";
  collapsed?: boolean;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
}

export function VedroLogo({
  variant = "dark",
  collapsed = false,
  className = "",
  size = "md",
  showTagline = false,
}: VedroLogoProps) {
  const isDark = variant === "dark";

  // Select logo asset based on background context (dark vs light surface) and collapsed state
  const logoSrc = collapsed
    ? isDark
      ? "/brand/vedro-emblem-darkbg.png"
      : "/brand/vedro-emblem-transparent.png"
    : isDark
    ? "/brand/vedro-logo-darkbg.png"
    : "/brand/vedro-logo-transparent.png";

  // Height definitions preserving the original aspect ratio
  const heightClasses = {
    xs: collapsed ? "h-6" : "h-7",
    sm: collapsed ? "h-7" : "h-8",
    md: collapsed ? "h-9" : "h-10",
    lg: collapsed ? "h-14" : "h-16",
    xl: collapsed ? "h-20" : "h-24",
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Transparent Brand Logo */}
      <img
        src={logoSrc}
        alt="Vedro Natural Food"
        className={`${heightClasses[size]} w-auto object-contain transition-transform duration-150 hover:scale-[1.02]`}
        loading="eager"
      />

      {showTagline && !collapsed && (
        <span
          className={`text-[9px] font-bold tracking-wider uppercase pl-2 border-l ${
            isDark
              ? "text-[#E8E2D5]/70 border-[#E8E2D5]/20"
              : "text-[#77736A] border-[#E8E2D5]"
          }`}
        >
          Natural Food OS
        </span>
      )}
    </div>
  );
}
