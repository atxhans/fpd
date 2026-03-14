import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { cn } from "../lib/utils";

interface IndustrialAlertProps {
  variant?: "warning" | "danger" | "info" | "success";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function IndustrialAlert({ variant = "warning", title, children, className }: IndustrialAlertProps) {
  const variants = {
    warning: {
      bg: "bg-primary",
      text: "text-black",
      icon: AlertTriangle,
      border: "border-black"
    },
    danger: {
      bg: "bg-danger",
      text: "text-white",
      icon: AlertCircle,
      border: "border-black"
    },
    info: {
      bg: "bg-black",
      text: "text-primary",
      icon: Info,
      border: "border-primary"
    },
    success: {
      bg: "bg-success",
      text: "text-black",
      icon: CheckCircle,
      border: "border-black"
    }
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg border-2 p-4",
      config.bg,
      config.text,
      config.border,
      className
    )}>
      {/* Diagonal Stripes Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            currentColor 10px,
            currentColor 20px
          )`
        }}></div>
      </div>
      
      {/* Content */}
      <div className="relative flex gap-3">
        <Icon className="h-6 w-6 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && <p className="font-bold mb-1">{title}</p>}
          <div className="font-medium">{children}</div>
        </div>
      </div>
    </div>
  );
}
