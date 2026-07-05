import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface DialogShellProps {
  isOpen: boolean;
  onClose: () => void;
  maxWidth: string;
  dismissOnBackdropClick?: boolean;
  title?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function DialogShell({
  isOpen,
  onClose,
  maxWidth,
  dismissOnBackdropClick = true,
  title,
  icon,
  footer,
  children,
}: DialogShellProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissOnBackdropClick ? onClose : undefined}
            className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative z-10 w-full ${maxWidth} bg-white rounded-2xl border border-[#e2e8f0] shadow-2xl overflow-hidden flex flex-col`}
          >
            {(title || icon) && (
              <div className="bg-[#0f172a] flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  {icon}
                  {title && <h2 className="text-white font-serif tracking-widest text-sm uppercase">{title}</h2>}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="flex-1 p-6">{children}</div>
            {footer && <div className="border-t border-[#e2e8f0] p-4 bg-[#f9f8ff]">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
