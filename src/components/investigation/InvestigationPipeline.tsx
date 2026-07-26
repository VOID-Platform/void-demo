'use client';

import { motion } from 'framer-motion';
import { PipelineStep } from './PipelineStep';
import { PIPELINE_STAGES } from '@/lib/types/investigation';
import type { PipelineState } from '@/lib/types/investigation';

interface InvestigationPipelineProps {
  pipelineState: PipelineState;
}

export function InvestigationPipeline({ pipelineState }: InvestigationPipelineProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
        <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
          Investigation Pipeline
        </h3>
      </div>

      <div>
        {PIPELINE_STAGES.map((ps, idx) => {
          const state = pipelineState[ps.stage];
          const status = state?.status ?? 'pending';
          const isLast = idx === PIPELINE_STAGES.length - 1;

          return (
            <PipelineStep
              key={ps.stage}
              label={ps.label}
              status={status}
              detail={state?.detail}
              isLast={isLast}
              subStep={state?.subStep}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
