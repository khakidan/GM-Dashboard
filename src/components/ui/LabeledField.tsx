import React from 'react';

export interface LabeledFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function LabeledField({
  label,
  children,
  className,
}: LabeledFieldProps) {
  return (
    <div className={className}>
      <div className="text-[10px] uppercase text-[#8d8db9] font-bold tracking-widest mb-2 px-1">{label}</div>
      {children}
    </div>
  );
}
