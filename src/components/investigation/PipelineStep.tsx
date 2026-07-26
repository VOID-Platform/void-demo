'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PipelineStatus } from './PipelineStatus';
import type { StageStatus, IssueAgentSubStep } from '@/lib/types/investigation';
import { ISSUE_AGENT_SUBSTEPS } from '@/lib/types/investigation';

interface PipelineStepProps {
  label: string;
  status: StageStatus;
  detail?: string;
  isLast: boolean;
  subStep?: IssueAgentSubStep;
}

export function PipelineStep({ label, status, detail, isLast, subStep }: PipelineStepProps) {
  const isActive = status === 'running';

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500 ${
            status === 'completed'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : status === 'failed'
              ? 'bg-red-500/10 border-red-500/30'
              : status === 'running'
              ? 'bg-violet-500/10 border-violet-500/40 ring-2 ring-violet-500/20'
              : 'bg-zinc-900 border-zinc-700'
          }`}
        >
          <PipelineStatus status={status} />
        </div>
        {!isLast && (
          <div
            className={`w-px flex-1 min-h-[2rem] ${
              status === 'completed' ? 'bg-emerald-500/20' : 'bg-zinc-800'
            }`}
          />
        )}
      </div>

      <div className="pb-8 pt-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium transition-colors ${
              status === 'completed'
                ? 'text-zinc-400'
                : status === 'failed'
                ? 'text-red-300'
                : status === 'running'
                ? 'text-white'
                : 'text-zinc-600'
            }`}
          >
            {label}
          </span>
          {isActive && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-[10px] font-mono text-violet-400 uppercase tracking-wider"
            >
              Running
            </motion.span>
          )}
        </div>

        {detail && (
          <p
            className={`text-xs font-mono mt-0.5 ${
              status === 'failed' ? 'text-red-400/70' : 'text-zinc-500'
            }`}
          >
            {detail}
          </p>
        )}

        <AnimatePresence>
          {isActive && subStep && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-1.5 pl-2 border-l-2 border-violet-500/20">
                {ISSUE_AGENT_SUBSTEPS.map((s) => (
                  <div key={s.step} className="flex items-center gap-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        s.step === subStep
                          ? 'bg-violet-400 animate-pulse'
                          : ISSUE_AGENT_SUBSTEPS.findIndex(x => x.step === s.step) < ISSUE_AGENT_SUBSTEPS.findIndex(x => x.step === subStep)
                          ? 'bg-emerald-400/50'
                          : 'bg-zinc-700'
                      }`}
                    />
                    <span
                      className={`text-xs font-mono ${
                        s.step === subStep
                          ? 'text-violet-300'
                          : ISSUE_AGENT_SUBSTEPS.findIndex(x => x.step === s.step) < ISSUE_AGENT_SUBSTEPS.findIndex(x => x.step === subStep)
                          ? 'text-zinc-500'
                          : 'text-zinc-700'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
