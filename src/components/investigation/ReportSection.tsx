'use client';

import type { ReactNode } from 'react';

interface ReportSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ReportSection({ title, children, className = '' }: ReportSectionProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  );
}
