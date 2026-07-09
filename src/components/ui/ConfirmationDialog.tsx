import React from 'react';
import { Button } from './Button';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 select-none animate-fade-in font-serif">
      <div className="bg-[#ffffff] border-2 border-[#2563eb] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
        <h3 className="text-xl font-bold text-[#0f172a] mb-3">{title}</h3>
        <p className="text-sm font-sans text-[#8d8db9] mb-6">{description}</p>
        <div className="flex justify-center gap-3 font-sans">
          <Button intent="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            intent="destructive"
            onClick={() => {
              onClose();
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
