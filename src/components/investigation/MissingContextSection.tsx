'use client';

import { AlertTriangle } from 'lucide-react';
import { ReportSection } from './ReportSection';
import type { MissingContext } from '@/lib/types/investigation';

interface MissingContextSectionProps {
  missing: MissingContext | null;
}

export function MissingContextSection({ missing }: MissingContextSectionProps) {
  if (!missing) return null;

  return (
    <ReportSection title="Missing Context">
      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-300">{missing.reason}</p>
        </div>

        {missing.missing_information && missing.missing_information.length > 0 && (
          <div className="pl-6">
            <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-wider mb-1">
              Missing Information
            </p>
            <ul className="space-y-0.5">
              {missing.missing_information.map((info, idx) => (
                <li key={idx} className="text-xs text-amber-400/70">
                  {info}
                </li>
              ))}
            </ul>
          </div>
        )}

        {missing.recommendations && missing.recommendations.length > 0 && (
          <div className="pl-6">
            <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-wider mb-1">
              Recommendations
            </p>
            <ul className="space-y-0.5">
              {missing.recommendations.map((rec, idx) => (
                <li key={idx} className="text-xs text-zinc-400">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ReportSection>
  );
}
