'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  ChevronDown,
  ExternalLink,
  GitPullRequest,
  Lock,
  Unlock,
  XCircle,
  CheckCircle2,
  RotateCcw,
  BrainCircuit,
} from 'lucide-react';
import { VoidLogo } from '@/components/VoidLogo';
import { ExecutionTrace, IncidentReport } from '@/lib/types';
import { Header } from '@/components/Header';
import { WalkthroughModal } from '@/components/WalkthroughModal';
import { IncidentIntelligence } from '@/components/IncidentIntelligence';

/* ─────────────────────────────────────────────────────────────────
   SCENARIOS & TYPES
   ───────────────────────────────────────────────────────────────── */
const SCENARIOS = [
  {
    index: 6,
    pill: 'Recursive Loop',
    color: 'red' as const,
    agentSteps: [
      { label: 'Received task', detail: 'Escalate high-priority sync bug to engineering' },
      { label: 'Planning', detail: 'Identified escalation path → github.createIssue' },
      { label: 'Tool execution', detail: 'github.createIssue called × 5 — identical parameters' },
      { label: 'Loop detected', detail: 'Five duplicate issues created in 710ms', isError: true },
    ],
  },
  {
    index: 4,
    pill: 'Silent Hallucination',
    color: 'amber' as const,
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
    color: 'red' as const,
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
    color: 'red' as const,
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
   PILL COLOURS
   ───────────────────────────────────────────────────────────────── */
const pillIdle = {
  red:   'border-red-500/35 text-red-400 hover:border-red-400 hover:bg-red-500/8',
  amber: 'border-amber-500/35 text-amber-300 hover:border-amber-400 hover:bg-amber-500/8',
};
const pillActive = {
  red:   'border-red-400 bg-red-500/12 text-red-300 shadow-sm shadow-red-500/15',
  amber: 'border-amber-400 bg-amber-500/12 text-amber-200 shadow-sm shadow-amber-500/10',
};

/* ─────────────────────────────────────────────────────────────────
   AGENT VISUALIZER
   ───────────────────────────────────────────────────────────────── */
interface AgentStep { label: string; detail: string; isError?: boolean; }

const AgentVisualizer: React.FC<{
  steps: readonly AgentStep[];
  phase: DiagnosisPhase;
  activeStepIndex: number;
}> = ({ steps, phase, activeStepIndex }) => (
  <div className="relative flex flex-col items-center gap-0 w-full max-w-sm mx-auto">
    {steps.map((step, idx) => {
      const isReached = activeStepIndex >= idx;
      const isActive  = activeStepIndex === idx && phase === 'running-agent';
      const isBad     = step.isError && isReached && phase !== 'idle';
      const isDone    = isReached && !isActive;

      return (
        <React.Fragment key={idx}>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isReached ? 1 : 0.18, x: 0 }}
            transition={{ duration: 0.35 }}
            className={`relative flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all ${
              isActive
                ? 'border-[#A855F7]/60 bg-[#14141A] shadow-lg shadow-[#A855F7]/10'
                : isBad
                ? 'border-red-500/50 bg-red-950/15'
                : isDone && step.isError
                ? 'border-red-500/30 bg-red-950/10'
                : isDone
                ? 'border-white/8 bg-[#0E0E12]'
                : 'border-white/4 bg-[#09090D]/40'
            }`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border ${
              isActive
                ? 'bg-[#A855F7]/15 border-[#A855F7]/50'
                : isBad || (isDone && step.isError)
                ? 'bg-red-500/15 border-red-500/50'
                : isDone
                ? 'bg-emerald-500/10 border-emerald-500/35'
                : 'bg-zinc-800/40 border-zinc-700/25'
            }`}>
              {isActive ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                  className="w-3 h-3 border-2 border-[#A855F7] border-t-transparent rounded-full" />
              ) : isBad || (isDone && step.isError) ? (
                <XCircle className="w-3.5 h-3.5 text-red-400" />
              ) : isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold font-sans ${
                isActive ? 'text-white'
                : isBad || (isDone && step.isError) ? 'text-red-300'
                : isDone ? 'text-zinc-200'
                : 'text-zinc-600'
              }`}>{step.label}</p>
              {isReached && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
                  className={`text-[11px] font-sans mt-0.5 leading-snug ${
                    isBad || (isDone && step.isError) ? 'text-red-400/75' : 'text-zinc-500'
                  }`}>{step.detail}</motion.p>
              )}
            </div>
          </motion.div>

          {idx < steps.length - 1 && (
            <div className={`w-px h-2.5 transition-all duration-500 ${
              activeStepIndex > idx ? 'bg-white/15' : 'bg-white/4'
            }`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ─────────────────────────────────────────────────────────────────
   TYPING LINE
   ───────────────────────────────────────────────────────────────── */
const TypingLine: React.FC<{ text: string; delay: number; className?: string }> = ({ text, delay, className = '' }) => {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

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
        <span className="inline-block w-0.5 h-[1em] bg-[#A855F7] ml-0.5 animate-pulse align-middle" />
      )}
    </motion.p>
  );
};

/* ─────────────────────────────────────────────────────────────────
   DIAGNOSIS CARD
   ───────────────────────────────────────────────────────────────── */
const CARD_SEVERITY = {
  critical: { dot: 'bg-red-400',     text: 'text-red-300',     border: 'border-red-500/30',     bg: 'bg-red-950/15',     label: 'Critical Incident' },
  warning:  { dot: 'bg-amber-400',   text: 'text-amber-300',   border: 'border-amber-500/30',   bg: 'bg-amber-950/10',   label: 'Warning' },
  success:  { dot: 'bg-emerald-400', text: 'text-emerald-300', border: 'border-emerald-500/30', bg: 'bg-emerald-950/10', label: 'Normal Operations' },
};

const DiagnosisCard: React.FC<{
  phase: DiagnosisPhase;
  report: IncidentReport | null;
  trace: ExecutionTrace | null;
}> = ({ phase, report, trace }) => {
  if (phase === 'idle') return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#0E0E12] border border-white/8 flex items-center justify-center">
        <BrainCircuit className="w-5 h-5 text-zinc-600" />
      </div>
      <p className="text-sm font-sans text-zinc-500 max-w-[220px] leading-relaxed">
        Press <span className="text-zinc-300 font-medium">Run Diagnosis</span> to watch VOID analyze this AI failure in real time.
      </p>
    </div>
  );

  if (phase === 'running-agent') return (
    <div className="h-full flex flex-col items-center justify-center gap-3 p-8">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
        className="w-6 h-6 border-2 border-[#A855F7] border-t-transparent rounded-full" />
      <p className="text-xs font-mono text-zinc-600">Capturing OpenTelemetry spans…</p>
    </div>
  );

  if (phase === 'analyzing') return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
      <div className="flex items-center gap-2.5">
        <VoidLogo size={16} glow={false} />
        <span className="text-xs font-mono text-[#A855F7]">VOID is analyzing</span>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div key={i} animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.18 }}
            className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
        ))}
      </div>
    </div>
  );

  if (!report || !trace) return null;
  const cfg = CARD_SEVERITY[report.severity];
  const T = { name: 0, ev0: 500, ev1: 1300, ev2: 2100, rec: 3100, future: 4300 };

  return (
    <motion.div key={`${trace.id}-done`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col gap-5 p-6 h-full overflow-y-auto">

      <div className="space-y-2.5">
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
          {cfg.label}
          <span className="text-zinc-600 font-normal">{report.confidence}% confidence</span>
        </motion.div>
        <TypingLine text={report.incident} delay={T.name}
          className="text-[22px] font-extrabold font-sans text-white leading-tight" />
      </div>

      <div className="space-y-2">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          Evidence from OpenTelemetry
        </motion.p>
        {report.evidence.slice(0, 3).map((ev, idx) => (
          <TypingLine key={idx} text={`• ${ev}`}
            delay={[T.ev0, T.ev1, T.ev2][idx]}
            className="text-xs font-sans text-zinc-300 leading-relaxed pl-1" />
        ))}
      </div>

      <div className="space-y-1.5">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: T.rec / 1000 }}
          className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          Recommendation
        </motion.p>
        <TypingLine text={report.recommendation} delay={T.rec}
          className="text-xs font-sans text-zinc-200 leading-relaxed" />
      </div>

      {report.futureRemediation && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: T.future / 1000, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-auto p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 shadow-lg shadow-emerald-500/10"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex-shrink-0 mt-0.5">
              <GitPullRequest className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-sans text-emerald-400 font-semibold uppercase tracking-wider mb-0.5">
                Tomorrow — VOID Server would
              </p>
              <p className="text-sm font-sans font-bold text-white leading-snug">{report.futureRemediation.action}</p>
              <p className="text-xs font-sans text-zinc-400 mt-0.5 leading-relaxed">{report.futureRemediation.details}</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded flex-shrink-0">
              {report.futureRemediation.target}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   EVIDENCE PANEL
   ───────────────────────────────────────────────────────────────── */
const EvidencePanel: React.FC<{ trace: ExecutionTrace | null; report: IncidentReport | null }> = ({ trace, report }) => {
  const [open, setOpen] = useState(false);
  if (!trace || !report) return null;
  const signozUrl = `http://localhost:8080/trace/${trace.traceId}`;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }} className="w-full max-w-4xl mx-auto">

      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-[#0E0E12] border border-white/8 hover:border-white/15 transition-all group">
        <div className="flex items-center gap-2.5">
          {open ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-[#A855F7]" />}
          <span className="text-xs font-sans font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">
            {open ? 'Hide OpenTelemetry proof' : 'Verify with OpenTelemetry →'}
          </span>
          <span className="text-[10px] font-mono text-zinc-600 hidden sm:inline">{trace.steps.length} spans captured</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={signozUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            className="text-[10px] font-mono text-zinc-500 hover:text-[#A855F7] transition-colors flex items-center gap-1 px-2 py-1 rounded-lg border border-white/8 hover:border-[#A855F7]/30">
            SigNoz <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-600 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden">
            <div className="pt-2 space-y-1">
              {trace.steps.map((step, idx) => (
                <motion.div key={step.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.035 }}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs ${
                    step.status === 'error'
                      ? 'bg-red-950/15 border-red-500/25 text-red-300'
                      : 'bg-[#09090D] border-white/5 text-zinc-300'
                  }`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-zinc-700 w-4">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="font-sans">{step.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-zinc-600">
                    <span>{step.durationMs}ms</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                      step.status === 'error'
                        ? 'bg-red-950/25 border-red-500/25 text-red-400'
                        : 'bg-[#0E0E12] border-white/6 text-zinc-500'
                    }`}>{step.kind}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
              className="mt-3 px-5 py-3.5 rounded-xl bg-[#09090D] border border-white/5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-sans text-zinc-500">
                The application code never changed.{' '}
                <span className="text-zinc-200 font-medium">Only the intelligence layer evolved.</span>
              </p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600">
                <span className="px-2 py-0.5 rounded bg-[#14141A] border border-white/6 text-zinc-500">DemoAnalyzer</span>
                <span>→</span>
                <span className="px-2 py-0.5 rounded bg-[#14141A] border border-emerald-500/25 text-emerald-400">VOID Server</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MAIN STAGE
   ───────────────────────────────────────────────────────────────── */
export const DiagnosisStage: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [phase, setPhase] = useState<DiagnosisPhase>('idle');
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [trace, setTrace] = useState<ExecutionTrace | null>(null);
  const [report, setReport] = useState<IncidentReport | null>(null);

  const scenario = SCENARIOS[activeIdx];
  const isRunning = phase === 'running-agent' || phase === 'analyzing';
  const [isExecutingAll, setIsExecutingAll] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  const isBusy = isRunning || isExecutingAll;

  const handleSelectScenario = useCallback((idx: number) => {
    if (isBusy) return;
    setActiveIdx(idx);
    setPhase('idle');
    setActiveStepIndex(-1);
    setTrace(null);
    setReport(null);
  }, [isBusy]);

  const handleRun = useCallback(async () => {
    if (isBusy) return;
    setPhase('running-agent');
    setActiveStepIndex(0);
    setTrace(null);
    setReport(null);

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
      const data = await res.json();
      if (data.success) {
        await new Promise<void>(r => setTimeout(r, 500));
        setTrace(data.trace);
        setReport(data.report);
        setPhase('complete');
      } else {
        setPhase('idle');
      }
    } catch {
      setPhase('idle');
    }
  }, [isBusy, scenario]);

  const handleRunAll = useCallback(async () => {
    if (isBusy) return;
    setIsExecutingAll(true);
    setActiveCount(10);
    setPhase('analyzing');
    setTrace(null);
    setReport(null);

    try {
      const res = await fetch('/api/agent/run-all', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.traces && data.traces.length > 0) {
        const currentScenarioIndex = SCENARIOS[activeIdx].index;
        let targetIdx = data.traces.findIndex((t: ExecutionTrace) => t.index === currentScenarioIndex);
        if (targetIdx === -1) {
          targetIdx = 0;
        }

        const matchedScenarioIdx = SCENARIOS.findIndex((s) => s.index === data.traces[targetIdx].index);
        if (matchedScenarioIdx !== -1) {
          setActiveIdx(matchedScenarioIdx);
          setActiveStepIndex(SCENARIOS[matchedScenarioIdx].agentSteps.length - 1);
        }

        setTrace(data.traces[targetIdx]);
        setReport(data.reports[targetIdx]);
        setPhase('complete');
      } else {
        setPhase('idle');
      }
    } catch {
      setPhase('idle');
    } finally {
      setIsExecutingAll(false);
      setActiveCount(0);
    }
  }, [isBusy, activeIdx]);

  return (
    <div className="min-h-screen flex flex-col bg-[#070709] bg-subtle-grid text-white">
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

      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.07) 0%, transparent 70%)' }} />

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col gap-8 px-4 pt-6 pb-20 max-w-5xl mx-auto w-full">

        {/* ── SCENARIO PILLS ── */}
        <div className="flex flex-wrap gap-2 justify-center">
          {SCENARIOS.map((s, idx) => (
            <button
              key={s.index}
              onClick={() => handleSelectScenario(idx)}
              disabled={isBusy}
              className={`px-4 py-2 rounded-full border text-xs font-sans font-semibold transition-all btn-tactile disabled:opacity-40 disabled:cursor-not-allowed ${
                activeIdx === idx ? pillActive[s.color] : pillIdle[s.color]
              }`}
            >
              {s.pill}
            </button>
          ))}
        </div>

        {/* ── TWO-PANEL: Execution flow (left) + VOID Incident Analysis (right) ── */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[2fr_3.8fr] gap-6 items-start">

          {/* LEFT — visual execution breadcrumbs */}
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Execution trace</p>
              <h2 className="text-base font-bold font-sans text-white tracking-tight leading-tight">
                {phase === 'idle' ? 'Awaiting run' : phase === 'complete' ? 'Captured' : 'Running…'}
              </h2>
            </div>

            <AgentVisualizer steps={scenario.agentSteps} phase={phase} activeStepIndex={activeStepIndex} />

            <motion.button
              onClick={handleRun}
              disabled={isBusy}
              whileHover={{ scale: isBusy ? 1 : 1.02 }}
              whileTap={{ scale: isBusy ? 1 : 0.98 }}
              className={`flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-bold font-sans text-white transition-all shadow-lg ${
                isRunning
                  ? 'bg-zinc-800 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#DF00FF] via-[#A855F7] to-[#7E22CE] shadow-[#A855F7]/25 hover:shadow-[#A855F7]/45'
              }`}
            >
              {isRunning ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  {phase === 'running-agent' ? 'Running agent…' : 'Analyzing…'}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Diagnosis
                </>
              )}
            </motion.button>
          </div>


          {/* RIGHT — VOID Incident Analysis (canonical design, do not modify) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeIdx}-${phase}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl bg-[#0E0E12] border border-white/8 min-h-[400px] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-white/6">
                <VoidLogo size={13} glow={false} />
                <span className="text-[10px] font-mono text-[#A855F7] font-bold uppercase tracking-widest">
                  VOID Incident Analysis
                </span>
                {phase === 'complete' && report && (
                  <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="ml-auto text-[10px] font-mono text-emerald-400 bg-emerald-950/25 border border-emerald-500/25 px-2 py-0.5 rounded">
                    Complete
                  </motion.span>
                )}
              </div>
              <DiagnosisCard phase={phase} report={report} trace={trace} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── OTLP EVIDENCE ACCORDION (collapsed by default) ── */}
        <AnimatePresence>
          {phase === 'complete' && (
            <EvidencePanel trace={trace} report={report} />
          )}
        </AnimatePresence>


      </main>
    </div>
  );
};
