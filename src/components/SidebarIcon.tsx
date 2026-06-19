import React from 'react';

export interface SidebarIconProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  'aria-label'?: string;
  id?: string;
  disabled?: boolean;
}

export function SidebarIcon({
  icon,
  label,
  isActive = false,
  onClick,
  'aria-label': ariaLabel,
  id,
  disabled = false,
}: SidebarIconProps) {
  return (
    <div className="relative group flex justify-center">
      <button
        id={id}
        onClick={onClick}
        disabled={disabled}
        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
          disabled
            ? 'opacity-30 cursor-not-allowed text-stone-500'
            : isActive
            ? 'bg-[#3f3f37] text-white ring-1 ring-[#c5b358]/30 cursor-pointer'
            : 'text-stone-400 hover:text-stone-200 hover:bg-[#3f3f37]/50 cursor-pointer'
        }`}
        aria-label={ariaLabel || label}
      >
        {icon}
      </button>
      {/* Tooltip */}
      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150">
        {label}
        {/* Small left-pointing arrow */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-800" />
      </div>
    </div>
  );
}
