'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExecutionTrace, ExecutionStep } from '@/lib/types';
import { Clock, ShieldCheck, CheckCircle2, XCircle, Terminal, Lock, Unlock, Eye } from 'lucide-react';

interface ExecutionTimelineProps {
  trace: ExecutionTrace | null;
  isExecuting?: boolean;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({ trace }) => {
  const [showEvidence, setShowEvidence] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  if (!trace) {
    return (
      <div className="p-10 text-center rounded-2xl bg-[#0E0E12] border border-white/10">
        <p className="text-sm font-sans font-medium text-zinc-300">Click "Run Incident" to evaluate this scenario</p>
      </div>
    );
  }

  const hasStepError = trace.steps.some((s) => s.status === 'error' || s.kind === 'FAILED');
  const isFailed = trace.status === 'critical' || hasStepError || !!trace.error;
  const isSemantic = trace.flaggedForSemantic;

  const toolStep = trace.steps.find((s) => s.kind === 'TOOL_EXECUTION' || s.kind === 'TOOL_SELECTION');
  const toolDesc = toolStep ? `Decided to invoke tool: ${toolStep.label}` : 'Zero tools invoked (Direct text response generated).';

  const outcomeText = trace.error
    ? `Execution failed: ${trace.error}`
    : hasStepError
    ? `Execution finished with span errors (status: ${trace.status})`
    : `Completed with status: ${trace.status}`;

  const reasoningSteps = [
    { title: 'Planning', label: 'Prompt Intent Breakdown', desc: `Agent parsed prompt intent: "${trace.prompt}"` },
    { title: 'Reasoning', label: 'Context & Policy Evaluation', desc: 'Evaluated system prompt, history, and available tool definitions.' },
    { title: 'Tool Decision', label: 'Tool Selection & Invocation', desc: toolDesc },
    { title: 'Outcome', label: 'Execution Verification', desc: outcomeText },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Reasoning Chain Presenter */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#0E0E12] border border-white/10 space-y-6 shadow-2xl">
        {/* Incident Metadata Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center space-x-3 mb-1.5">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#14141A] text-zinc-200 border border-white/15">
                Incident #{trace.index}
              </span>
              <h3 className="text-xl font-sans font-extrabold text-white tracking-tight">{trace.title}</h3>
              {isSemantic && (
                <span className="text-xs font-sans px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Semantic Sampling Flagged</span>
                </span>
              )}
            </div>
            <p className="text-sm font-sans text-zinc-300">
              <span className="text-zinc-500 font-mono text-xs">USER_PROMPT:</span> "{trace.prompt}"
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#070709] border border-white/10 text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-[#A855F7]" />
              <span>{trace.latencyMs}ms</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#070709] border border-white/10 text-zinc-300">
              {trace.totalTokens.toLocaleString()} tokens
            </div>
          </div>
        </div>

        {/* 4 Reasoning Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {reasoningSteps.map((step, idx) => {
            const isSelected = activeStep === idx;
            const isStepError =
              idx === 3
                ? isFailed || trace.steps.some((s) => s.status === 'error')
                : idx === 0
                ? trace.steps.some((s) => s.kind === 'PLANNING' && s.status === 'error')
                : idx === 1
                ? trace.steps.some((s) => s.kind === 'REASONING' && s.status === 'error')
                : idx === 2
                ? trace.steps.some((s) => (s.kind === 'TOOL_SELECTION' || s.kind === 'TOOL_EXECUTION') && s.status === 'error')
                : false;

            return (
              <div
                key={step.title}
                onClick={() => setActiveStep(idx)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all btn-tactile ${
                  isStepError
                    ? 'bg-red-950/30 border-red-500/50 text-red-300'
                    : isSelected
                    ? 'bg-[#14141A] border-[#A855F7] shadow-lg shadow-[#A855F7]/15 ring-1 ring-[#A855F7]'
                    : 'bg-[#070709] border-white/5 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">STEP 0{idx + 1}</span>
                  {isStepError ? (
                    <XCircle className="w-4 h-4 text-red-400 animate-pulse" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div className="text-sm font-sans font-bold text-white">{step.title}</div>
                <div className="text-xs font-sans text-zinc-400 mt-1 line-clamp-2">{step.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Selected Step Detail Box */}
        <div className="p-4 rounded-xl bg-[#070709] border border-white/10 space-y-1.5">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#A855F7] font-bold">
            <Eye className="w-4 h-4 text-[#A855F7]" />
            <span>STEP 0{activeStep + 1} DETAILS: {reasoningSteps[activeStep].title}</span>
          </div>
          <p className="text-sm font-sans text-white leading-relaxed">{reasoningSteps[activeStep].desc}</p>
        </div>
      </div>

      {/* Minimalist Forensic Proof Lock */}
      <div className="p-5 rounded-2xl bg-[#0E0E12] border border-white/10 space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-sans font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#A855F7]" />
              <span>Simulated Execution Steps (OTLP Trace Spans) ({trace.steps.length} Spans)</span>
            </h4>
            <p className="text-xs font-sans text-zinc-400 mt-0.5">
              Standard OTLP instrumentation captured every span without changing application code.
            </p>
          </div>

          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#14141A] border border-[#A855F7]/40 text-white text-xs font-mono font-bold hover:border-[#A855F7] transition-all shadow-sm btn-tactile"
          >
            {showEvidence ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-[#A855F7]" />}
            <span>{showEvidence ? 'HIDE_PROOF' : 'UNLOCK_FORENSIC_PROOF'}</span>
          </button>
        </div>

        {showEvidence && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 pt-2 border-t border-white/10"
          >
            {trace.steps.map((step: ExecutionStep, idx: number) => (
              <div
                key={step.id}
                className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                  step.status === 'error'
                    ? 'bg-red-950/30 border-red-500/40 text-red-300'
                    : 'bg-[#070709] border-white/10 text-zinc-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs text-zinc-500">0{idx + 1}</span>
                  <span className="font-sans font-bold text-white text-sm">{step.label}</span>
                  <span className="font-mono text-xs text-zinc-400">[{step.timestamp}]</span>
                </div>

                <div className="flex items-center space-x-2 font-mono text-xs text-zinc-400">
                  <span className="px-2 py-0.5 rounded bg-[#0E0E12] border border-white/10 text-zinc-300">
                    {step.durationMs}ms
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#0E0E12] border border-white/10 text-emerald-400">
                    {step.kind}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};
