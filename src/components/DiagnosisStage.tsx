'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Play,
  ChevronDown,
  ExternalLink,
  XCircle,
  CheckCircle2,
  BrainCircuit,
  Sparkles,
} from 'lucide-react';
import { VoidLogo } from '@/components/VoidLogo';
import { ExecutionTrace, IncidentReport } from '@/lib/types';
import { Header } from '@/components/Header';
import { WalkthroughModal } from '@/components/WalkthroughModal';

/* ─────────────────────────────────────────────────────────────────
   SCROLL-REVEAL WRAPPER
   ───────────────────────────────────────────────────────────────── */
const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-5% 0px -5% 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ willChange: 'transform, opacity' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   SCENARIOS
   ───────────────────────────────────────────────────────────────── */
const SCENARIOS = [
  {
    index: 6,
    pill: 'Recursive Loop',
    agentSteps: [
      { label: 'Received task', detail: 'Escalate high-priority sync bug to engineering' },
      { label: 'Planning', detail: 'Identified escalation path → github.createIssue' },
      { label: 'Tool execution', detail: 'github.createIssue called × 5 — identical parameters', isError: true },
      { label: 'Loop detected', detail: 'Five duplicate issues created in 710ms', isError: true },
    ],
  },
  {
    index: 4,
    pill: 'Silent Hallucination',
    agentSteps: [
      { label: 'Received task', detail: 'What is the weather in Paris?' },
      { label: 'Planning', detail: 'Parsed weather query — tool lookup expected' },
      { label: 'Skipped tools', detail: 'Generated response without calling any weather API', isError: true },
      { label: 'Responded', detail: '"The weather in Paris is 25°C." — unverified claim' },
    ],
  },
  {
    index: 8,
    pill: 'Wrong Tool',
    agentSteps: [
      { label: 'Received task', detail: 'Create a GitHub issue for the payment gateway timeout bug' },
      { label: 'Planning', detail: 'Classified intent as: notification task' },
      { label: 'Wrong tool selected', detail: 'Called slack.sendMessage instead of github.createIssue', isError: true },
      { label: 'Reported success', detail: 'Agent confirmed "issue created" — GitHub issue was never opened' },
    ],
  },
  {
    index: 9,
    pill: 'Execution Crash',
    agentSteps: [
      { label: 'Received task', detail: 'Process automated seat upgrade for team billing' },
      { label: 'Planning', detail: 'Validated billing permissions and org balance' },
      { label: 'Tool crash', detail: 'stripe.updateQuantity — ConnectionResetError during TLS', isError: true },
      { label: 'No completion span', detail: 'Agent died mid-stream — billing state unknown', isError: true },
    ],
  },
] as const;

type DiagnosisPhase = 'idle' | 'running-agent' | 'analyzing' | 'complete';

/* ─────────────────────────────────────────────────────────────────
   TYPING LINE (for revealing analysis text)
   ───────────────────────────────────────────────────────────────── */
const TypingLine: React.FC<{ text: string; delay: number; className?: string }> = ({ text, delay, className = '' }) => {
  const [displayed, setDisplayed] = React.useState('');
  const [started, setStarted] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  React.useEffect(() => {
    if (!started) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, 16);
    return () => clearInterval(iv);
  }, [started, text]);

  if (!started && !displayed) return null;
  return (
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={className}>
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-0.5 h-[1em] bg-[#8b5cf6] ml-0.5 animate-pulse align-middle" />
      )}
    </motion.p>
  );
};

/* ─────────────────────────────────────────────────────────────────
   AGENT STEP (single line in the execution flow)
   ───────────────────────────────────────────────────────────────── */
interface AgentStep { label: string; detail: string; isError?: boolean; }

const AgentStepLine: React.FC<{
  step: AgentStep;
  index: number;
  isReached: boolean;
  isActive: boolean;
  phase: DiagnosisPhase;
}> = ({ step, index, isReached, isActive, phase }) => {
  const isBad = step.isError && isReached && phase !== 'idle';
  const isDone = isReached && !isActive;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: isReached ? 1 : 0.15, x: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-4 py-3"
    >
      {/* Status indicator */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all duration-500 ${
        isActive
          ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/40'
          : isBad || (isDone && step.isError)
          ? 'bg-red-500/10 border-red-500/30'
          : isDone
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-white/[0.02] border-white/[0.04]'
      }`}>
        {isActive ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            className="w-3.5 h-3.5 border-2 border-[#8b5cf6] border-t-transparent rounded-full"
          />
        ) : isBad || (isDone && step.isError) ? (
          <XCircle className="w-4 h-4 text-red-400" />
        ) : isDone ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400/80" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${
          isActive ? 'text-white'
          : isBad || (isDone && step.isError) ? 'text-red-300'
          : isDone ? 'text-zinc-300'
          : 'text-zinc-700'
        }`}>
          {step.label}
        </p>
        {isReached && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`text-sm mt-0.5 ${
              isBad || (isDone && step.isError) ? 'text-red-400/60' : 'text-zinc-600'
            }`}
          >
            {step.detail}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   SEVERITY CONFIG
   ───────────────────────────────────────────────────────────────── */
const SEVERITY = {
  critical: { color: 'text-red-400', bg: 'bg-red-950/20', border: 'border-red-500/20', dot: 'bg-red-400', label: 'Critical Incident' },
  warning:  { color: 'text-amber-300', bg: 'bg-amber-950/15', border: 'border-amber-500/20', dot: 'bg-amber-400', label: 'Warning' },
  success:  { color: 'text-emerald-400', bg: 'bg-emerald-950/15', border: 'border-emerald-500/20', dot: 'bg-emerald-400', label: 'Normal Operations' },
};

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────── */
export const DiagnosisStage: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [phase, setPhase] = useState<DiagnosisPhase>('idle');
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [trace, setTrace] = useState<ExecutionTrace | null>(null);
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [isExecutingAll, setIsExecutingAll] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenario = SCENARIOS[activeIdx];
  const isRunning = phase === 'running-agent' || phase === 'analyzing';
  const isBusy = isRunning || isExecutingAll;

  const handleSelectScenario = useCallback((idx: number) => {
    if (isBusy) return;
    setActiveIdx(idx);
    setPhase('idle');
    setActiveStepIndex(-1);
    setTrace(null);
    setReport(null);
    setEvidenceOpen(false);
    setError(null);
  }, [isBusy]);

  const handleRun = useCallback(async () => {
    if (isBusy) return;
    setError(null);
    setPhase('running-agent');
    setActiveStepIndex(0);
    setTrace(null);
    setReport(null);
    setEvidenceOpen(false);

    const STEP_MS = 850;
    for (let i = 1; i < scenario.agentSteps.length; i++) {
      await new Promise<void>(r => setTimeout(r, STEP_MS));
      setActiveStepIndex(i);
    }
    await new Promise<void>(r => setTimeout(r, 650));
    setPhase('analyzing');

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: scenario.index }),
      });
      if (!res.ok) {
        setError(`Server returned ${res.status}. Please try again.`);
        setPhase('idle');
        return;
      }
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Investigation failed. No error details provided.');
        setPhase('idle');
        return;
      }
      if (!data.trace || !data.report) {
        setError('Investigation completed but returned incomplete data. Check API response format.');
        setPhase('idle');
        return;
      }
      await new Promise<void>(r => setTimeout(r, 500));
      setTrace(data.trace);
      setReport(data.report);
      setPhase('complete');
    } catch (err) {
      setError(err instanceof TypeError ? 'Network error — unable to reach the investigation service.' : 'Unexpected error during investigation.');
      setPhase('idle');
    }
  }, [isBusy, scenario]);

  const handleRunAll = useCallback(async () => {
    if (isBusy) return;
    setError(null);
    setIsExecutingAll(true);
    setActiveCount(10);
    setPhase('analyzing');
    setTrace(null);
    setReport(null);

    try {
      const res = await fetch('/api/agent/run-all', { method: 'POST' });
      if (!res.ok) {
        setError(`Server returned ${res.status}. Please try again.`);
        setPhase('idle');
        return;
      }
      const data = await res.json();
      if (!data.success || !data.traces || data.traces.length === 0) {
        setError('Batch investigation returned no results.');
        setPhase('idle');
        return;
      }
      const currentScenarioIndex = SCENARIOS[activeIdx].index;
      let targetIdx = data.traces.findIndex((t: ExecutionTrace) => t.index === currentScenarioIndex);
      if (targetIdx === -1) targetIdx = 0;

      const matchedScenarioIdx = SCENARIOS.findIndex((s) => s.index === data.traces[targetIdx].index);
      if (matchedScenarioIdx !== -1) {
        setActiveIdx(matchedScenarioIdx);
        setActiveStepIndex(SCENARIOS[matchedScenarioIdx].agentSteps.length - 1);
      }

      setTrace(data.traces[targetIdx]);
      setReport(data.reports[targetIdx]);
      setPhase('complete');
    } catch (err) {
      setError(err instanceof TypeError ? 'Network error — unable to reach the investigation service.' : 'Unexpected error during batch investigation.');
      setPhase('idle');
    } finally {
      setIsExecutingAll(false);
      setActiveCount(0);
    }
  }, [isBusy, activeIdx]);

  const cfg = report ? SEVERITY[report.severity] : null;
  const T = { name: 0, ev0: 500, ev1: 1300, ev2: 2100, rec: 3100 };

  return (
    <div className="min-h-screen bg-[#050508] text-[#f4f4f5] flex flex-col">
      <Header
        onRunAll={handleRunAll}
        onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
        isExecuting={isBusy}
        activeCount={activeCount}
      />

      <WalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
        onSelectTraceIndex={(index) => {
          const matchIdx = SCENARIOS.findIndex((s) => s.index === index);
          if (matchIdx !== -1) {
            handleSelectScenario(matchIdx);
          }
        }}
      />

      {/* Hero Section */}
      <section className="relative pt-16 pb-12 overflow-hidden border-b border-white/[0.04]">
        {/* Ambient radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.1) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-[#a78bfa]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8b5cf6]" />
            <span>OpenTelemetry AI Incident Intelligence</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-display-lg text-white font-bold tracking-tight"
          >
            Instrument AI applications once.<br />
            Turn telemetry into incident intelligence.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base text-zinc-400 max-w-xl mx-auto leading-relaxed"
          >
            AI agents introduce entirely new failure modes. VOID interprets OpenTelemetry traces and delivers forensic root-cause reports instantly.
          </motion.p>
        </div>
      </section>

      {/* Main Interactive Demo Container */}
      <main className="relative z-10 flex-1 py-12 md:py-16 max-w-3xl mx-auto px-6 w-full space-y-12">

        {/* Scenario Selection Header */}
        <div className="text-center space-y-3">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            Select an AI failure scenario to run
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {SCENARIOS.map((s, idx) => (
              <button
                key={s.index}
                onClick={() => handleSelectScenario(idx)}
                disabled={isBusy}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 btn-tactile disabled:opacity-30 disabled:cursor-not-allowed ${
                  activeIdx === idx
                    ? 'bg-white/[0.08] text-white border border-white/12 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-white/[0.06]'
                }`}
              >
                {s.pill}
              </button>
            ))}
          </div>
        </div>

        {/* Execution Flow */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-zinc-600 tracking-wide uppercase">
              {phase === 'idle' ? 'Awaiting execution' : phase === 'complete' ? 'Execution captured' : 'Running agent…'}
            </p>
          </div>

          {/* Agent Steps */}
          <div className="space-y-0 divide-y divide-white/[0.04] bg-white/[0.015] border border-white/[0.06] rounded-2xl p-4">
            {scenario.agentSteps.map((step, idx) => (
              <AgentStepLine
                key={idx}
                step={step}
                index={idx}
                isReached={activeStepIndex >= idx}
                isActive={activeStepIndex === idx && phase === 'running-agent'}
                phase={phase}
              />
            ))}
          </div>

          {/* Run Button */}
          <motion.button
            onClick={handleRun}
            disabled={isBusy}
            whileHover={{ scale: isBusy ? 1 : 1.01 }}
            whileTap={{ scale: isBusy ? 1 : 0.98 }}
            className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl text-base font-semibold text-white transition-all duration-300 btn-tactile ${
              isRunning
                ? 'bg-white/[0.04] cursor-not-allowed text-zinc-500'
                : 'bg-[#8b5cf6] hover:bg-[#7c3aed] shadow-lg shadow-[#8b5cf6]/20 hover:shadow-[#8b5cf6]/30'
            }`}
          >
            {isRunning ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
                />
                {phase === 'running-agent' ? 'Running agent…' : 'Analyzing telemetry…'}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Diagnosis</span>
              </>
            )}
          </motion.button>
        </div>

        {/* VOID Analysis Result */}
        <AnimatePresence mode="wait">
          {phase === 'analyzing' && !report && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-4 py-16"
            >
              <div className="flex items-center gap-2.5">
                <VoidLogo size={18} glow={true} />
                <span className="text-sm font-mono text-[#8b5cf6]">VOID is analyzing traces</span>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.18 }}
                    className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-3 py-16 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-950/20 border border-red-500/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-sm font-mono text-red-400 max-w-[40ch] leading-relaxed">
                {error}
              </p>
              <button
                onClick={() => setError(null)}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {phase === 'complete' && report && trace && cfg && (
            <motion.div
              key={`${trace.id}-complete`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-10 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 md:p-8"
            >
              {/* Incident Name */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                    {cfg.label}
                  </div>
                  <span className="text-xs font-mono text-zinc-600">
                    {report.confidence}% confidence
                  </span>
                </div>

                <TypingLine
                  text={report.incident}
                  delay={T.name}
                  className="text-heading text-white leading-tight"
                />
              </div>

              {/* Evidence */}
              <div className="space-y-4">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs font-mono text-zinc-600 uppercase tracking-[0.15em]"
                >
                  Evidence from OpenTelemetry
                </motion.p>

                <div className="space-y-3 pl-4 border-l border-[#8b5cf6]/20">
                  {report.evidence.slice(0, 3).map((ev, idx) => (
                    <TypingLine
                      key={idx}
                      text={ev}
                      delay={[T.ev0, T.ev1, T.ev2][idx]}
                      className="text-base text-zinc-300 leading-relaxed"
                    />
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div className="space-y-3">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: T.rec / 1000 }}
                  className="text-xs font-mono text-zinc-600 uppercase tracking-[0.15em]"
                >
                  Actionable Recommendation
                </motion.p>
                <TypingLine
                  text={report.recommendation}
                  delay={T.rec}
                  className="text-base text-zinc-200 leading-relaxed"
                />
              </div>

              {/* Evidence Accordion (OTLP Spans) */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.5, duration: 0.5 }}
              >
                <button
                  onClick={() => setEvidenceOpen(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm text-zinc-500 group-hover:text-zinc-300 transition-colors">
                      {evidenceOpen ? 'Hide OpenTelemetry proof' : 'Verify with OpenTelemetry spans'}
                    </span>
                    <span className="text-xs font-mono text-zinc-700">
                      {trace.steps.length} spans
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`http://localhost:8080/trace/${trace.traceId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-xs font-mono text-zinc-600 hover:text-[#a78bfa] transition-colors flex items-center gap-1 px-2 py-1 rounded-lg border border-white/[0.04] hover:border-[#8b5cf6]/20"
                    >
                      SigNoz <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-600 transition-transform duration-300 ${evidenceOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {evidenceOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 space-y-1">
                        {trace.steps.map((step, idx) => (
                          <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm ${
                              step.status === 'error'
                                ? 'bg-red-950/10 border border-red-500/15 text-red-300'
                                : 'bg-white/[0.015] border border-white/[0.04] text-zinc-400'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-zinc-700 text-xs w-5">{String(idx + 1).padStart(2, '0')}</span>
                              <span>{step.label}</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-xs text-zinc-600">
                              <span>{step.durationMs}ms</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                step.status === 'error'
                                  ? 'bg-red-950/20 text-red-400'
                                  : 'bg-white/[0.03] text-zinc-600'
                              }`}>{step.kind}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
