'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ExecutionTrace } from '@/lib/types';
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ExecutionListProps {
  traces: ExecutionTrace[];
  selectedTraceId: string | null;
  onSelectTrace: (trace: ExecutionTrace) => void;
}

export const ExecutionList: React.FC<ExecutionListProps> = ({
  traces,
  selectedTraceId,
  onSelectTrace,
}) => {
  // 5 Real Production Incident Scenarios
  const incidentScenarios = [
    {
      index: 4,
      title: 'Silent Hallucination in Customer Response',
      tagline: 'Agent answered "25°C in Paris" with ZERO tools invoked.',
      severity: 'warning',
      impact: 'Misinformed End User',
    },
    {
      index: 6,
      title: 'Recursive API Execution Loop ($450 Token Burn)',
      tagline: 'Executed github.createIssue 5 consecutive times in an unchecked loop.',
      severity: 'critical',
      impact: 'Severe Token & API Quota Waste',
    },
    {
      index: 8,
      title: 'Tool Action Mismatch',
      tagline: 'User asked to open GitHub issue; agent executed slack.sendMessage instead.',
      severity: 'warning',
      impact: 'Incorrect Side Effect',
    },
    {
      index: 9,
      title: 'Silent Execution Crash Mid-Stream',
      tagline: 'Reasoned and planned, but tool call crashed without emitting completion span.',
      severity: 'critical',
      impact: 'Unresolved User Task',
    },
    {
      index: 1,
      title: 'Normal Operations (Baseline Control)',
      tagline: 'Healthy execution emitting complete OpenTelemetry spans.',
      severity: 'success',
      impact: 'Baseline Healthy',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Beat Header */}
      <div className="border-b border-white/10 pb-3 flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-[#A855F7] uppercase tracking-wider font-bold">BEAT 1 OF 5</span>
          <h2 className="text-xl font-sans font-extrabold text-white tracking-tight">What went wrong?</h2>
        </div>
        <span className="text-xs font-mono text-zinc-400">Select Production Incident Case</span>
      </div>

      {/* Incident Case Grid */}
      <div className="space-y-3">
        {incidentScenarios.map((scen) => {
          const matchingTrace = traces.find((t) => t.index === scen.index) || traces[0];
          const isSelected = selectedTraceId === matchingTrace?.id;

          return (
            <motion.div
              key={scen.index}
              whileHover={{ scale: 1.005 }}
              onClick={() => matchingTrace && onSelectTrace(matchingTrace)}
              className={`p-5 rounded-2xl border text-left cursor-pointer transition-all btn-tactile ${
                isSelected
                  ? 'bg-[#14141A] border-[#A855F7] shadow-xl shadow-[#A855F7]/20 ring-1 ring-[#A855F7]'
                  : 'bg-[#0E0E12] border-white/10 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  {scen.severity === 'critical' ? (
                    <span className="flex items-center space-x-1 px-3 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-sans font-semibold">
                      <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                      <span>Critical Incident</span>
                    </span>
                  ) : scen.severity === 'warning' ? (
                    <span className="flex items-center space-x-1 px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-sans font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Warning</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-sans font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Healthy Baseline</span>
                    </span>
                  )}
                  <span className="text-xs font-mono text-zinc-400">Incident #{scen.index}</span>
                </div>
                <span className="text-xs font-mono text-zinc-400">{scen.impact}</span>
              </div>

              <h3 className="text-base font-sans font-bold text-white tracking-tight">{scen.title}</h3>
              <p className="text-xs font-sans text-zinc-300 mt-1 leading-relaxed">{scen.tagline}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
