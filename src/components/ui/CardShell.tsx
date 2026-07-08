import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CardShellProps extends Omit<HTMLMotionProps<"div">, 'children'> {
  syncing?: boolean;
  highlight?: 'selected' | 'active-turn' | null;
  cornerBadge?: React.ReactNode;
  children?: React.ReactNode;
}

export const CardShell: React.FC<CardShellProps> = ({
  syncing = false,
  highlight = null,
  cornerBadge,
  children,
  className,
  ...props
}) => {
  const baseStyle = "relative bg-white rounded-2xl border transition-all";

  let stateStyle = "";
  if (highlight === 'selected') {
    stateStyle = "bg-[#f0f7ff] border-[#2563eb] shadow-[0_0_15px_rgba(37,99,235,0.15)] border-l-[6px] border-l-[#2563eb]";
  } else if (highlight === 'active-turn') {
    stateStyle = "bg-[#f0f7ff] border-2 border-[#2563eb] shadow-md z-10";
  } else if (syncing) {
    stateStyle = "border-[#2563eb] shadow-[0_0_15px_rgba(37,99,235,0.2)] shadow-[#2563eb]/20";
  } else {
    stateStyle = "border-[#e2e8f0] shadow-sm hover:shadow-md";
  }

  return (
    <motion.div
      className={cn(baseStyle, stateStyle, className)}
      {...props}
    >
      {cornerBadge && (
        <div className="absolute -top-3 left-6 z-20">
          {cornerBadge}
        </div>
      )}
      {syncing && !highlight && (
        <div className="absolute top-2 right-10 z-20 flex items-center gap-1 bg-[#2563eb] text-white text-xs uppercase font-bold px-3 py-1 rounded-full shadow-sm animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing
        </div>
      )}
      {children}
    </motion.div>
  );
};
