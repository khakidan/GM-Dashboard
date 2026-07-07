import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface DialogShellProps {
  isOpen: boolean;
  onClose: () => void;
  maxWidth: string;
  zIndex?: string;
  dismissOnBackdropClick?: boolean;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  subheader?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function DialogShell({
  isOpen,
  onClose,
  maxWidth,
  zIndex = 'z-50',
  dismissOnBackdropClick = true,
  title,
  subtitle,
  icon,
  subheader,
  footer,
  children,
}: DialogShellProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4`}>
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
                  <div>
                    {title && <h2 className="text-white font-serif tracking-widest text-sm uppercase">{title}</h2>}
                    {subtitle && <p className="text-xs text-[#e2e8f0]/60">{subtitle}</p>}
                  </div>
                </div>
                <IconButton icon={<X className="w-5 h-5" />} onClick={onClose} onDark aria-label="Close" />
              </div>
            )}
            {subheader}
            <div className="flex-1 p-6">{children}</div>
            {footer && <div className="border-t border-[#e2e8f0] px-6 py-4 bg-[#ffffff]">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
