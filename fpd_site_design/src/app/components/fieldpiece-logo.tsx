interface FieldpieceLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  variant?: "default" | "light";
}

export function FieldpieceLogo({ size = "md", showTagline = true, variant = "default" }: FieldpieceLogoProps) {
  const sizes = {
    sm: { container: "h-8", text: "text-sm", tagline: "text-[10px]" },
    md: { container: "h-10", text: "text-base", tagline: "text-xs" },
    lg: { container: "h-14", text: "text-xl", tagline: "text-sm" },
  };
  
  const textColor = variant === "light" ? "text-white" : "text-black";
  const taglineColor = variant === "light" ? "text-primary" : "text-primary";
  
  return (
    <div className="flex items-center gap-3">
      {/* Logo Icon - Yellow & Black Industrial Design */}
      <div className={`${sizes[size].container} aspect-square flex items-center justify-center bg-black rounded-md relative overflow-hidden`}>
        {/* Yellow diagonal stripe */}
        <div className="absolute inset-0 bg-primary transform -rotate-45 translate-x-1/4"></div>
        {/* Black overlay with F cutout effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-3/5 h-3/5" fill="none">
            <path
              d="M8 6h8v3h-5v3h4v3h-4v5H8V6z"
              fill="#FFD100"
              stroke="#000000"
              strokeWidth="1"
            />
          </svg>
        </div>
      </div>
      
      {/* Text */}
      <div className="flex flex-col justify-center leading-tight">
        <span className={`font-bold ${sizes[size].text} ${textColor} tracking-tight`}>
          FIELDPIECE
        </span>
        {showTagline && (
          <span className={`${sizes[size].tagline} ${taglineColor} font-semibold tracking-wide`}>
            DIGITAL
          </span>
        )}
      </div>
    </div>
  );
}
