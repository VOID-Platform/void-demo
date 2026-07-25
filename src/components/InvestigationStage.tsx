'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Play,
  ChevronDown,
  ExternalLink,
  XCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  Cpu,
  Zap,
  Activity,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Terminal,
  RotateCcw,
  Trash2,
  Loader2,
  Check,
} from 'lucide-react';
import { VoidLogo } from '@/components/VoidLogo';
import { ExecutionTrace } from '@/lib/types';
import { Header } from '@/components/Header';
import { WalkthroughModal } from '@/components/WalkthroughModal';

interface InvestigationResult {
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  incidentId?: string;
  severity?: string;
  labels?: string[];
  confidence?: number;
  evaluation?: Record<string, unknown>;
  engineeringReport?: Record<string, unknown> | null;
  issueUrl?: string | null;
  error?: string;
}

const STATUS_LABEL: Record<string, string> = {
  QUEUED: 'Queued for investigation…',
  PROCESSING: 'Running LLM evaluator…',
  COMPLETED: 'Report ready',
  FAILED: 'Investigation failed',
};

/* ─────────────────────────────────────────────────────────────────
   ANIMATED COUNT UP HOOK (For Live Confidence Meter)
   ───────────────────────────────────────────────────────────────── */
function useCountUp(target: number, duration: number = 1.2, startTrigger: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startTrigger) {
      setCount(0);
      return;
    }

    let start = 0;
    const end = target;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [target, duration, startTrigger]);

  return count;
}

/* ─────────────────────────────────────────────────────────────────
   FLUID SCROLL REVEAL WRAPPER
   ───────────────────────────────────────────────────────────────── */
const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-8% 0px -8% 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ willChange: 'transform, opacity' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   SCENARIOS & AGENT STEPS DATA
   ───────────────────────────────────────────────────────────────── */
const SCENARIOS = [
  {
    index: 1,
    pill: 'Recursive API Loop',
    severity: 'critical' as const,
    summary: 'slack.sendMessage executed 5 consecutive times in 710ms',
    agentSteps: [
      { label: 'Received task', detail: 'Escalate high-priority sync bug to engineering' },
      { label: 'Planning', detail: 'Identified escalation path → slack.sendMessage' },
      { label: 'Tool execution', detail: 'slack.sendMessage called × 5 — identical parameters', isError: true },
      { label: 'Loop detected', detail: 'Five duplicate notifications sent in 710ms', isError: true },
    ],
  },
  {
    index: 3,
    pill: 'Silent Hallucination',
    severity: 'warning' as const,
    summary: 'Weather in Paris claimed as 25°C with ZERO tools invoked',
    agentSteps: [
      { label: 'Received task', detail: 'What is the weather in Paris?' },
      { label: 'Planning', detail: 'Parsed weather query — tool lookup expected' },
      { label: 'Skipped tools', detail: 'Generated response without calling any weather API', isError: true },
      { label: 'Responded', detail: '"The weather in Paris is 25°C." — unverified claim' },
    ],
  },
  {
    index: 11,
    pill: 'Wrong Tool Action',
    severity: 'critical' as const,
    summary: 'User requested GitHub issue; agent executed slack.sendMessage',
    agentSteps: [
      { label: 'Received task', detail: 'Create a GitHub issue for the payment gateway timeout bug' },
      { label: 'Planning', detail: 'Classified intent as: notification task' },
      { label: 'Wrong tool selected', detail: 'Called slack.sendMessage instead of github.createIssue', isError: true },
      { label: 'Reported success', detail: 'Agent confirmed "issue created" — GitHub issue was never opened' },
    ],
  },
  {
    index: 2,
    pill: 'Execution Crash',
    severity: 'critical' as const,
    summary: 'Agent process crashed mid-stream during Stripe seat update',
    agentSteps: [
      { label: 'Received task', detail: 'Process automated seat upgrade for team billing' },
      { label: 'Planning', detail: 'Validated billing permissions and org balance' },
      { label: 'Tool crash', detail: 'stripe.updateQuantity — ConnectionResetError during TLS', isError: true },
      { label: 'No completion span', detail: 'Agent died mid-stream — billing state unknown', isError: true },
    ],
  },
] as const;

type DiagnosisPhase = 'idle' | 'running-agent' | 'polling' | 'complete' | 'failed';

/* ─────────────────────────────────────────────────────────────────
   TYPING ANIMATED LINE
   ───────────────────────────────────────────────────────────────── */
const TypingLine: React.FC<{ text: string; delay: number; className?: string }> = ({ text, delay, className = '' }) => {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, 14);
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
   AGENT STEP LINE (KINETIC STEP REVEAL)
   ───────────────────────────────────────────────────────────────── */
interface AgentStep { label: string; detail: string; isError?: boolean; }

const AgentStepLine: React.FC<{
  step: AgentStep;
  index: number;
  isReached: boolean;
  isActive: boolean;
  phase: DiagnosisPhase;
}> = ({ step, isReached, isActive, phase }) => {
  const isBad = step.isError && isReached && phase !== 'idle';
  const isDone = isReached && !isActive;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isReached ? 1 : 0.18, x: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-4 py-3.5"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all duration-500 ${
        isActive
          ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/50 shadow-sm shadow-[#8b5cf6]/20 ring-2 ring-[#8b5cf6]/20'
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
          <CheckCircle2 className="w-4 h-4 text-emerald-400/90" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold transition-colors duration-300 ${
          isActive ? 'text-white'
          : isBad || (isDone && step.isError) ? 'text-red-300'
          : isDone ? 'text-zinc-200'
          : 'text-zinc-700'
        }`}>
          {step.label}
        </p>
        {isReached && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`text-xs font-mono mt-0.5 ${
              isBad || (isDone && step.isError) ? 'text-red-400/70' : 'text-zinc-500'
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
   SEVERITY BADGE CONFIG
   ───────────────────────────────────────────────────────────────── */
const SEVERITY = {
  critical: { color: 'text-red-400', bg: 'bg-red-950/20', border: 'border-red-500/20', dot: 'bg-red-400', label: 'Critical Incident' },
  warning:  { color: 'text-amber-300', bg: 'bg-amber-950/15', border: 'border-amber-500/20', dot: 'bg-amber-400', label: 'Warning' },
  success:  { color: 'text-emerald-400', bg: 'bg-emerald-950/15', border: 'border-emerald-500/20', dot: 'bg-emerald-400', label: 'Normal Operations' },
};

/* ─────────────────────────────────────────────────────────────────
   MAIN INVESTIGATION STAGE COMPONENT
   ───────────────────────────────────────────────────────────────── */
export const InvestigationStage: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [phase, setPhase] = useState<DiagnosisPhase>('idle');
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [trace, setTrace] = useState<ExecutionTrace | null>(null);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [investigation, setInvestigation] = useState<InvestigationResult | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenario = SCENARIOS[activeIdx];
  const isRunning = phase === 'running-agent' || phase === 'polling';
  const isBusy = isRunning;

  // TanStack Query v5: poll investigation until COMPLETED or FAILED
  // ponytail: refetchInterval fn stops once terminal state — no onSuccess/onError in v5
  const { data: pollData, error: pollError } = useQuery<InvestigationResult>({
    queryKey: ['investigation', incidentId],
    enabled: !!incidentId && phase === 'polling',
    refetchInterval: (query) => {
      const s = (query.state.data as InvestigationResult | undefined)?.status;
      return s === 'COMPLETED' || s === 'FAILED' ? false : 2000;
    },
    queryFn: async () => {
      const res = await fetch(`/api/investigations/${incidentId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<InvestigationResult>;
    },
  });

  useEffect(() => {
    if (!pollData || phase !== 'polling') return;
    if (pollData.status === 'COMPLETED') {
      setInvestigation(pollData);
      setPhase('complete');
    } else if (pollData.status === 'FAILED') {
      setError(pollData.error ?? 'Investigation failed in worker.');
      setPhase('failed');
    }
  }, [pollData, phase]);

  useEffect(() => {
    if (!pollError || phase !== 'polling') return;
    setError(pollError instanceof Error ? pollError.message : 'Polling error');
    setPhase('failed');
  }, [pollError, phase]);

  // Confidence count-up: from backend confidence (0–1 scale → pct)
  const confidencePct = investigation?.confidence != null
    ? Math.round(investigation.confidence * 100)
    : 0;
  const animatedConfidence = useCountUp(confidencePct, 1.2, phase === 'complete');

  const [isResetting, setIsResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleResetDemoState = useCallback(async () => {
    if (isResetting || isBusy) return;
    setIsResetting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' });
      if (res.ok) {
        setResetDone(true);
        setPhase('idle');
        setTrace(null);
        setIncidentId(null);
        setInvestigation(null);
        setEvidenceOpen(false);
        setActiveStepIndex(-1);
        setTimeout(() => setResetDone(false), 3000);
      } else {
        setError('Failed to reset database & queues.');
      }
    } catch {
      setError('Network error resetting system state.');
    } finally {
      setIsResetting(false);
    }
  }, [isResetting, isBusy]);

  const handleSelectScenario = useCallback((idx: number) => {
    if (isBusy) return;
    setActiveIdx(idx);
    setPhase('idle');
    setActiveStepIndex(-1);
    setTrace(null);
    setIncidentId(null);
    setInvestigation(null);
    setEvidenceOpen(false);
    setError(null);
  }, [isBusy]);

  const handleRun = useCallback(async () => {
    if (isBusy) return;
    setError(null);
    setPhase('running-agent');
    setActiveStepIndex(0);
    setTrace(null);
    setIncidentId(null);
    setInvestigation(null);
    setEvidenceOpen(false);

    const STEP_MS = 750;
    for (let i = 1; i < scenario.agentSteps.length; i++) {
      await new Promise<void>(r => setTimeout(r, STEP_MS));
      setActiveStepIndex(i);
    }
    await new Promise<void>(r => setTimeout(r, 600));
    setPhase('polling');

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: scenario.index }),
      });
      if (!res.ok) { setError(`Server returned ${res.status}.`); setPhase('failed'); return; }
      const data = await res.json();
      if (!data.success) { setError(data.error ?? 'Investigation failed.'); setPhase('failed'); return; }

      setTrace(data.trace);

      if (data.report) {
        setInvestigation({
          status: 'COMPLETED',
          severity: data.report.severity === 'warning' ? 'SUSPICIOUS' : (data.report.severity?.toUpperCase() ?? 'SUSPICIOUS'),
          confidence: (data.report.confidence ?? 85) / 100,
          labels: ['SILENT_HALLUCINATION'],
          evaluation: {
            classification: data.report.incident,
            reasoning: data.report.evidence,
            summary: data.report.recommendation,
          },
          engineeringReport: {
            executive_summary: data.report.incident,
            suggested_fix: data.report.recommendation,
          },
        });
        setPhase('complete');
        return;
      }

      if (data.isHealthy || !data.incidentId) {
        // Healthy execution — no incident to poll
        setInvestigation({ status: 'COMPLETED', severity: 'HEALTHY' });
        setPhase('complete');
        return;
      }

      setIncidentId(data.incidentId);
      // phase stays 'polling' — useQuery takes over
    } catch (err) {
      setError(err instanceof TypeError ? 'Network error.' : 'Unexpected error.');
      setPhase('failed');
    }
  }, [isBusy, scenario]);

  // Derive severity badge config from backend response
  const severityKey =
    (investigation?.severity === 'CRITICAL' || investigation?.severity === 'SUSPICIOUS')
      ? (investigation.severity === 'CRITICAL' ? 'critical' : 'warning')
      : investigation?.severity === 'HEALTHY' ? 'success'
      : investigation?.labels && investigation.labels.length > 0 ? 'warning' : 'success';
  const cfg = phase === 'complete' ? SEVERITY[severityKey as keyof typeof SEVERITY] : null;

  // Derive display fields from backend evaluation JSON
  const evalData = investigation?.evaluation as Record<string, unknown> | null | undefined;
  const engReport = investigation?.engineeringReport as Record<string, unknown> | null | undefined;
  const backendLabels: string[] = (investigation?.labels ?? []) as string[];
  const backendEvidence: string[] = evalData?.reasoning
    ? (Array.isArray(evalData.reasoning) ? evalData.reasoning as string[] : [String(evalData.reasoning)])
    : backendLabels.map(l => `Risk label: ${l}`);
  const backendRecommendation: string =
    (engReport?.suggested_fix as string) ??
    (evalData?.summary as string) ??
    'Review the engineering report for remediation steps.';
  const backendIncidentName: string =
    (engReport?.executive_summary as string) ??
    (evalData?.classification as string) ??
    (investigation?.severity === 'HEALTHY' ? 'Normal Execution — No Quality Issues' : 'Incident Detected');

  // ponytail: polling status label shown in shimmer block
  const pollingLabel = STATUS_LABEL[incidentId ? (investigation?.status ?? 'QUEUED') : 'QUEUED'];

  const T = { name: 0, ev0: 400, ev1: 1100, ev2: 1800, rec: 2600 };

  return (
    <div className="min-h-screen bg-[#050508] text-[#f4f4f5] flex flex-col font-sans selection:bg-[#8b5cf6]/30 selection:text-white">
      {/* Sticky Header */}
      <Header
        onRunAll={() => {}}
        onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
        isExecuting={isBusy}
        activeCount={0}
      />

      {/* 90s Presenter Pitch Script Modal */}
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

      {/* ━━━ ACT 1: THE INCITING INCIDENT — Hook & Spatial Contrast ━━━ */}
      <section className="relative pt-20 pb-24 border-b border-white/[0.05] overflow-hidden" id="hero">
        {/* Ambient Radial Spotlight */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[550px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.08) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-10">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-[#a78bfa]">
              <Sparkles className="w-3.5 h-3.5 text-[#8b5cf6]" />
              <span>AI Application Incident Intelligence</span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-[clamp(2.5rem,5.5vw,4.75rem)] font-bold tracking-[-0.04em] text-white leading-[1.06]">
              AI agents fail in ways traditional monitoring cannot explain.
            </h1>
          </Reveal>

          {/* Spatial Contrast Cards: Traditional APM vs VOID Intelligence */}
          <Reveal delay={0.25}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left max-w-3xl mx-auto pt-4">
              {/* Traditional APM (Dull/Opaque) */}
              <div className="p-6 rounded-3xl bg-white/[0.015] border border-white/[0.05] space-y-3 opacity-60">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-500 uppercase tracking-wider">
                  <span>Traditional APM</span>
                  <span className="text-emerald-400/80 font-semibold">200 OK</span>
                </div>
                <p className="text-sm text-zinc-400 font-mono">
                  HTTP 200 OK • CPU 38% • Memory 1.1GB
                </p>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  System metrics report perfect health while the agent loops silently or returns hallucinated responses to end users.
                </p>
              </div>

              {/* VOID Intelligence (Vibrant/Elevated) */}
              <div className="p-6 rounded-3xl bg-[#8b5cf6]/[0.05] border border-[#8b5cf6]/20 space-y-3 shadow-lg shadow-[#8b5cf6]/5">
                <div className="flex items-center justify-between text-xs font-mono text-[#a78bfa] uppercase tracking-wider font-semibold">
                  <span>VOID Telemetry Intelligence</span>
                  <span className="text-red-400">Incident Detected</span>
                </div>
                <p className="text-sm text-white font-mono font-semibold">
                  5 duplicate API calls in 710ms • 0 tools for factual claim
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Reconstructs prompt intent, reasoning spans, and tool execution side-effects from standard OpenTelemetry traces.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ━━━ ACT 2: TELEMETRY ASSEMBLY — OpenTelemetry Spans Lock ━━━ */}
      <section className="py-20 border-b border-white/[0.05] relative bg-white/[0.008]" id="telemetry">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <Reveal>
            <div className="space-y-3">
              <p className="text-xs font-mono text-[#a78bfa] tracking-[0.2em] uppercase">
                Zero Code Modification
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Standard OpenTelemetry instrumentation.
              </h2>
              <p className="text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
                The SDK emits standard OTLP spans. The SDK stays invisible — VOID delivers the intelligence.
              </p>
            </div>
          </Reveal>

          {/* Span Connection Graphic */}
          <Reveal delay={0.2}>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 font-mono text-xs">
              <div className="px-4 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.08] text-zinc-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#8b5cf6]" />
                <span>llm.planning (45ms)</span>
              </div>
              <span className="text-zinc-600">→</span>
              <div className="px-4 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.08] text-zinc-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#8b5cf6]" />
                <span>tool.execution (140ms)</span>
              </div>
              <span className="text-zinc-600">→</span>
              <div className="px-4 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.08] text-zinc-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#8b5cf6]" />
                <span>llm.reasoning (110ms)</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ━━━ ACT 3: THE INVESTIGATION STAGE (Interactive Failure Reconstruction) ━━━ */}
      <section className="py-20 md:py-28 relative" id="investigation">
        <div className="max-w-3xl mx-auto px-6 space-y-12">

          {/* Section Header & Aesthetic Reset Button */}
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="text-left space-y-3 max-w-xl">
                <p className="text-xs font-mono text-[#a78bfa] tracking-[0.2em] uppercase">
                  Interactive Investigation
                </p>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                  Reconstruct a production incident
                </h2>
                <p className="text-base text-zinc-400 leading-relaxed">
                  Select an AI failure scenario below to watch VOID assemble the reasoning trace and deliver actionable root cause evidence.
                </p>
              </div>

              {/* Aesthetic Reset Queue & DB Button */}
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleResetDemoState}
                disabled={isResetting || isBusy}
                className="self-start sm:self-end flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-500/10 via-purple-500/10 to-blue-500/10 hover:from-red-500/20 hover:via-purple-500/20 hover:to-blue-500/20 border border-white/10 hover:border-red-500/40 text-xs font-mono font-medium text-zinc-300 hover:text-white shadow-xl shadow-red-950/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed group shrink-0"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                    <span>Resetting Queue & DB…</span>
                  </>
                ) : resetDone ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                    <span className="text-emerald-300 font-semibold">State Cleared!</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 text-red-400 group-hover:rotate-[-180deg] transition-transform duration-500" />
                    <span>Reset Queue & DB</span>
                  </>
                )}
              </motion.button>
            </div>
          </Reveal>

          {/* Scenario Selector Pills (Double-Bezel Architecture) */}
          <Reveal delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SCENARIOS.map((s, idx) => (
                <button
                  key={s.index}
                  onClick={() => handleSelectScenario(idx)}
                  disabled={isBusy}
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 btn-tactile disabled:opacity-40 disabled:cursor-not-allowed ${
                    activeIdx === idx
                      ? 'bg-[#8b5cf6]/[0.08] border-[#8b5cf6]/40 text-white shadow-lg shadow-[#8b5cf6]/10 ring-1 ring-[#8b5cf6]/30'
                      : 'bg-white/[0.015] border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold font-mono text-[#a78bfa]">{s.pill}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      s.severity === 'critical'
                        ? 'bg-red-950/20 text-red-400 border-red-500/20'
                        : 'bg-amber-950/20 text-amber-300 border-amber-500/20'
                    }`}>
                      {s.severity}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-snug">{s.summary}</p>
                </button>
              ))}
            </div>
          </Reveal>

          {/* Execution Trace Reconstruction Box */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-zinc-500 tracking-wide uppercase">
                {phase === 'idle' ? 'Awaiting scenario execution' : phase === 'complete' ? 'Execution captured' : 'Running agent execution…'}
              </p>
            </div>

            {/* Agent Steps Timeline Container */}
            <div className="space-y-0 divide-y divide-white/[0.04] bg-white/[0.015] border border-white/[0.06] rounded-3xl p-5 md:p-7 shadow-xl">
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

            {/* Run Investigation Button (Button-in-Button Architecture) */}
            <motion.button
              onClick={handleRun}
              disabled={isBusy}
              whileHover={{ scale: isBusy ? 1 : 1.01 }}
              whileTap={{ scale: isBusy ? 1 : 0.98 }}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-base font-semibold text-white transition-all duration-300 btn-tactile ${
                isRunning
                  ? 'bg-white/[0.04] cursor-not-allowed text-zinc-500'
                  : 'bg-[#8b5cf6] hover:bg-[#7c3aed] shadow-lg shadow-[#8b5cf6]/25 hover:shadow-[#8b5cf6]/40'
              }`}
            >
              <span>
                {phase === 'running-agent'
                  ? 'Emitting OpenTelemetry Spans…'
                  : phase === 'polling'
                  ? 'Analyzing Failure Patterns…'
                  : 'Run Investigation'}
              </span>

              {/* Trailing Icon Pill */}
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                {isRunning ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </div>
            </motion.button>
          </div>

          {/* VOID Incident Intelligence Analysis Output */}
          <AnimatePresence mode="wait">
            {phase === 'polling' && (
              <motion.div
                key="polling"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-4 py-16"
              >
                <div className="flex items-center gap-2.5">
                  <VoidLogo size={22} glow={true} />
                  <span className="text-sm font-mono text-[#a78bfa]">{pollingLabel}</span>
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

            {phase === 'complete' && investigation && cfg && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-10 bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden"
              >
                {/* Subtle Ambient Radial Light behind card */}
                <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-[#8b5cf6]/[0.03] rounded-full blur-3xl pointer-events-none" />

                {/* Incident Title, Severity Badge & Live Confidence Meter */}
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                      {cfg.label}
                    </div>

                    {/* Animated Live Confidence Meter */}
                    <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08]">
                      <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Confidence</span>
                      <span className="text-xs font-mono font-bold text-[#a78bfa]">
                        {animatedConfidence}%
                      </span>
                    </div>
                  </div>

                  <TypingLine
                    text={backendIncidentName}
                    delay={T.name}
                    className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight"
                  />
                </div>

                {/* Forensic Evidence Bullets */}
                <div className="space-y-4 relative z-10">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs font-mono text-zinc-500 uppercase tracking-[0.15em]"
                  >
                    Forensic Evidence
                  </motion.p>

                  <div className="space-y-3 pl-4 border-l border-[#8b5cf6]/30">
                    {backendEvidence.slice(0, 3).map((ev: string, idx: number) => (
                      <TypingLine
                        key={idx}
                        text={ev}
                        delay={[T.ev0, T.ev1, T.ev2][idx]}
                        className="text-base text-zinc-300 leading-relaxed"
                      />
                    ))}
                  </div>
                </div>



                {/* OpenTelemetry Proof Inspector — only shown when a real trace exists */}
                {trace && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 3.0, duration: 0.5 }}
                  className="relative z-10"
                >
                  <button
                    onClick={() => setEvidenceOpen(v => !v)}
                    className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/12 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors font-medium">
                        {evidenceOpen ? 'Hide raw OpenTelemetry spans' : 'Inspect OpenTelemetry spans'}
                      </span>
                      <span className="text-xs font-mono text-zinc-600">
                        ({trace.steps.length} spans captured)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`http://localhost:8080/trace/${trace.traceId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-xs font-mono text-zinc-500 hover:text-[#a78bfa] transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/[0.04] hover:border-[#8b5cf6]/30"
                      >
                        SigNoz <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform duration-300 ${evidenceOpen ? 'rotate-180' : ''}`} />
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
                        <div className="pt-3 space-y-1.5">
                          {trace.steps.map((step, idx) => (
                            <div
                              key={step.id}
                              className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-mono ${
                                step.status === 'error'
                                  ? 'bg-red-950/15 border border-red-500/20 text-red-300'
                                  : 'bg-white/[0.015] border border-white/[0.04] text-zinc-400'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-zinc-700 text-xs w-5">{String(idx + 1).padStart(2, '0')}</span>
                                <span>{step.label}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <span>{step.durationMs}ms</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] ${
                                  step.status === 'error'
                                    ? 'bg-red-950/30 text-red-400'
                                    : 'bg-white/[0.04] text-zinc-500'
                                }`}>{step.kind}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>
    </div>
  );
};
