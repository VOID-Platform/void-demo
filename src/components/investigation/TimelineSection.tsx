'use client';

import { motion } from 'framer-motion';
import { Terminal, Wrench, AlertTriangle, FileSearch, Target } from 'lucide-react';
import { ReportSection } from './ReportSection';
import type { TimelineEvent } from '@/lib/types/investigation';

const EVENT_ICONS: Record<string, typeof Terminal> = {
  execution_step: Terminal,
  tool_call: Wrench,
  failure_observable: AlertTriangle,
  evidence: FileSearch,
  root_cause: Target,
};

const EVENT_COLORS: Record<string, string> = {
  execution_step: 'text-zinc-400',
  tool_call: 'text-blue-400',
  failure_observable: 'text-amber-400',
  evidence: 'text-violet-400',
  root_cause: 'text-red-400',
};

const EVENT_BG: Record<string, string> = {
  execution_step: 'bg-zinc-900',
  tool_call: 'bg-blue-500/5',
  failure_observable: 'bg-amber-500/5',
  evidence: 'bg-violet-500/5',
  root_cause: 'bg-red-500/5',
};

interface TimelineSectionProps {
  events: TimelineEvent[];
}

export function TimelineSection({ events }: TimelineSectionProps) {
  if (!events || events.length === 0) return null;

  return (
    <ReportSection title="Execution Timeline">
      <div className="space-y-1">
        {events.map((event, idx) => {
          const Icon = EVENT_ICONS[event.event_type] || Terminal;
          const colorClass = EVENT_COLORS[event.event_type] || 'text-zinc-400';
          const bgClass = EVENT_BG[event.event_type] || 'bg-zinc-900';

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`flex items-start gap-3 px-3 py-2 rounded-lg ${bgClass}`}
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorClass}`} />
              <div className="min-w-0">
                <p className="text-sm text-zinc-300 leading-relaxed">{event.description}</p>
                {event.step_index != null && (
                  <span className="text-[10px] font-mono text-zinc-600">
                    step {event.step_index}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </ReportSection>
  );
}
