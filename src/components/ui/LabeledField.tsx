import React from 'react';

export interface LabeledFieldProps {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
  size?: 'compact' | 'default';
}

export function LabeledField({
  label,
  children,
  className,
  htmlFor,
  size = 'compact',
}: LabeledFieldProps) {
  const labelClasses = size === 'compact'
    ? "text-[10px] uppercase text-[#8d8db9] font-bold tracking-widest mb-2 px-1"
    : "block text-xs font-bold uppercase tracking-  widest text-[#8d8db9] mb-1.5 px-1";

  return (
    <div className={className}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClasses}>{label}</label>
      ) : (
        <div className={labelClasses}>{label}</div>
      )}
      {children}
    </div>
  );
}
