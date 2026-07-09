import React from 'react';
import { cn } from '../../lib/utils';

export interface DashboardLayoutProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  filterControls?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  description,
  actions,
  filterControls,
  children,
  className,
  id,
}) => {
  return (
    <div id={id} className={cn("bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden flex-1 flex flex-col w-full", className)}>
      <div className="bg-[#ffffff] border-b border-[#e2e8f0] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">{title}</h1>
            <p className="text-sm text-[#8d8db9] mt-0.5">{description}</p>
          </div>
          {actions}
        </div>
        {filterControls && (
          <div className="mt-6 flex flex-col gap-4">
            {filterControls}
          </div>
        )}
      </div>
      <div className="flex-1 bg-white w-full p-6 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};
