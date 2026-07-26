'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { StageStatus } from '@/lib/types/investigation';

export function PipelineStatus({ status }: { status: StageStatus }) {
  if (status === 'completed') {
    return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
  }

  if (status === 'failed') {
    return <XCircle className="w-5 h-5 text-red-400" />;
  }

  if (status === 'running') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      >
        <Loader2 className="w-5 h-5 text-violet-400" />
      </motion.div>
    );
  }

  return <div className="w-5 h-5 rounded-full border-2 border-zinc-700" />;
}
