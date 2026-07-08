import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export interface ExpandableContentProps {
  isExpanded: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ExpandableContent({
  isExpanded,
  children,
  className,
}: ExpandableContentProps) {
  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn("overflow-hidden border-t border-[#e2e8f0] bg-white", className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
