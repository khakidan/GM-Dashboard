import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  severity: 'info' | 'warning' | 'error';
  children: React.ReactNode;
}

export function Callout({ severity, children, className, ...props }: CalloutProps) {
  const baseStyle = "flex items-start rounded-xl";

  const severityStyles = {
    error: "bg-red-50 border border-red-100 p-4 gap-3 text-red-800 text-sm shadow-sm",
    warning: "bg-[#f9f8ff] border border-amber-200 p-3.5 gap-2.5 text-amber-800 text-xs",
    // UNVALIDATED PLACEHOLDER: No real instance of 'info' severity exists yet in the codebase.
    // Implemented for completeness to align with STYLE_GUIDE.md design specs.
    info: "bg-blue-50 border border-blue-200 p-3.5 gap-2.5 text-blue-800 text-xs",
  };

  const iconSizeMap = {
    error: "w-5 h-5",
    warning: "w-5 h-5",
    info: "w-5 h-5",
  };

  const iconColorMap = {
    error: "", // Inherits text-red-800 from parent container matching production reality
    warning: "text-[#2563eb]", // Confirmed fixed color from production warning instances
    info: "", // Inherits text-blue-800 from parent container
  };

  return (
    <div className={cn(baseStyle, severityStyles[severity], className)} {...props}>
      <AlertCircle className={cn(iconSizeMap[severity], iconColorMap[severity], "shrink-0 mt-0.5")} />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
