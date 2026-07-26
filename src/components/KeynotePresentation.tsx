'use client';

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  memo,
} from 'react';
import {
  motion,
  AnimatePresence,
} from 'framer-motion';
import {
  Play,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Zap,
  Layers,
  Cpu,
  XCircle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  GitPullRequest,
  RotateCcw,
  Loader2,
  Check,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { VoidLogo } from '@/components/VoidLogo';
import { InvestigationPipeline } from '@/components/investigation/InvestigationPipeline';
import { CompletionCard } from '@/components/investigation/InvestigationPage';
import { useQuery } from '@tanstack/react-query';
import type { PipelineState, PipelineEvent, InvestigationResponse } from '@/lib/types/investigation';
import { PIPELINE_STAGES, getStageErrorMessage } from '@/lib/types/investigation';

/* ══════════════════════════════════════════════════════════════════
   CONSTANTS & DATA
══════════════════════════════════════════════════════════════════ */

const SSE_BASE = process.env.NEXT_PUBLIC_VOID_SERVER_URL || 'http://localhost:3001';
const TOTAL_SLIDES = 4;

type DiagnosisPhase = 'idle' | 'running-agent' | 'analyzing' | 'sampled' | 'healthy' | 'complete' | 'failed';
type PresentationMode = 'slides' | 'demo';

const SLIDE_SPRING = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 38,
  mass: 0.9,
};

const SCENARIOS = [
  {
    index: 1,
    pill: 'Recursive API Loop',
    severity: 'critical' as const,
    summary: 'slack.sendMessage executed 5 consecutive times in 710ms',
    agentSteps: [
      { label: 'Task received', detail: 'Escalate high-priority sync bug to engineering' },
      { label: 'Planning', detail: 'Identified escalation path → slack.sendMessage' },
      { label: 'Tool execution', detail: 'slack.sendMessage called × 5 — identical parameters', isError: true },
      { label: 'Loop detected', detail: 'Five duplicate messages created in 710ms', isError: true },
    ],
  },
  {
    index: 3,
    pill: 'Cascading Failure + Cover-Up',
    severity: 'warning' as const,
    summary: 'Deploy succeeded, 4× rollout-status timeouts, agent fabricated verification',
    agentSteps: [
      { label: 'Task received', detail: 'Deploy auth hotfix v2.1 to production' },
      { label: 'Deploy started', detail: 'k8s.deploy — deployment dep_hotfix_881 created' },
      { label: '4× timeout', detail: 'k8s.rolloutStatus timed out 4 consecutive times', isError: true },
      { label: 'Cover-up', detail: 'Agent faked Slack confirmation — hotfix never verified', isError: true },
    ],
  },
  {
    index: 11,
    pill: 'Wrong Tool Action',
    severity: 'critical' as const,
    summary: 'User requested GitHub issue; agent executed slack.sendMessage',
    agentSteps: [
      { label: 'Task received', detail: 'Create a GitHub issue for the payment gateway timeout bug' },
      { label: 'Intent classified', detail: 'Classified as: notification task — incorrect' },
      { label: 'Wrong tool selected', detail: 'Called slack.sendMessage instead of github.createIssue', isError: true },
      { label: 'False success reported', detail: 'Agent confirmed "issue created" — GitHub issue never opened' },
    ],
  },
  {
    index: 2,
    pill: 'Execution Crash',
    severity: 'critical' as const,
    summary: 'Agent process crashed mid-stream during seat update',
    agentSteps: [
      { label: 'Task received', detail: 'Process automated seat upgrade for team billing' },
      { label: 'Pre-flight checks', detail: 'Validated billing permissions and org balance' },
      { label: 'TLS crash', detail: 'stripe.updateQuantity — ConnectionResetError during TLS', isError: true },
      { label: 'Span never emitted', detail: 'Agent died mid-stream — billing state ambiguous', isError: true },
    ],
  },
] as const;

interface AgentStep { label: string; detail: string; isError?: boolean; }

const AgentStepLine = memo(function AgentStepLine({
  step,
  index,
  isReached,
  isActive,
  phase,
}: {
  step: AgentStep;
  index: number;
  isReached: boolean;
  isActive: boolean;
  phase: DiagnosisPhase;
}) {
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
});

/* ══════════════════════════════════════════════════════════════════
   SLIDE 01 — HERO
══════════════════════════════════════════════════════════════════ */
const Slide01Hero = memo(function Slide01Hero({
  onEnterDemo,
  onNext,
}: {
  onEnterDemo: () => void;
  onNext: () => void;
}) {
  return (
    <section className="keynote-slide slide-01-ambient" id="slide-01">
      {/* Ambient orbs — GPU-safe, pointer-events-none, transform only */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full animate-pulse-glow"
          style={{
            background: 'radial-gradient(circle, rgba(109,40,217,0.14) 0%, transparent 70%)',
            willChange: 'transform, opacity',
          }}
        />
      </div>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <VoidLogo size={52} glow={true} />
        </motion.div>

        {/* VOID wordmark */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.05, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="font-sans font-[800] tracking-[-0.055em] leading-[0.92] text-white select-none"
          style={{ fontSize: 'clamp(5.5rem, 18vw, 14rem)', willChange: 'transform, opacity' }}
        >
          VOID
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-[clamp(0.9rem,2vw,1.15rem)] text-zinc-400 font-medium tracking-[0.05em] uppercase"
          style={{ willChange: 'transform, opacity' }}
        >
          AI Observability · Production Intelligence
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 flex items-center gap-4 flex-wrap justify-center"
          style={{ willChange: 'transform, opacity' }}
        >
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-semibold text-sm transition-all duration-300 shadow-[0_0_40px_rgba(139,92,246,0.28)] hover:shadow-[0_0_60px_rgba(139,92,246,0.42)] btn-tactile"
          >
            Start presentation
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onEnterDemo}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/[0.03] border border-white/[0.09] hover:border-white/[0.16] text-zinc-400 hover:text-white font-medium text-sm transition-all duration-300 btn-tactile"
          >
            Skip to Live Demo
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[11px] font-mono text-zinc-600 tracking-[0.18em] uppercase select-none"
      >
        Press → to advance
      </motion.p>
    </section>
  );
});

/* ══════════════════════════════════════════════════════════════════
   SLIDE 02 — PRODUCTION
══════════════════════════════════════════════════════════════════ */

const STAT_LINES = [
  { value: '47M+', label: 'agent calls per day' },
  { value: '3.2B', label: 'LLM tokens daily' },
  { value: '94%', label: 'enterprises deploying AI agents by 2026' },
];

const Slide02Production = memo(function Slide02Production() {
  const words = ['AI', 'agents', 'are', 'entering', 'production.'];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="keynote-slide slide-02-ambient" id="slide-02">
      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center px-2">
        {/* Left — editorial statement */}
        <div className="space-y-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-overline text-[#a78bfa] uppercase tracking-[0.22em]"
          >
            The moment we're in
          </motion.p>

          <h2
            className="font-[700] tracking-[-0.04em] leading-[1.0] text-white"
            style={{ fontSize: 'clamp(2.4rem, 5.5vw, 5rem)' }}
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={visible ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.7,
                  delay: i * 0.1 + 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="inline-block mr-[0.28em] last:mr-0"
                style={{ willChange: 'transform, opacity' }}
              >
                {word}
              </motion.span>
            ))}
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="text-base text-zinc-400 leading-relaxed max-w-[50ch]"
            style={{ willChange: 'transform, opacity' }}
          >
            Autonomous LLM agents are making real decisions — billing customers,
            escalating incidents, modifying databases. They don't fail like
            traditional software.
          </motion.p>
        </div>

        {/* Right — stat cards */}
        <div className="space-y-4">
          {STAT_LINES.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 28 }}
              animate={visible ? { opacity: 1, x: 0 } : {}}
              transition={{
                duration: 0.75,
                delay: 0.35 + i * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="double-bezel px-7 py-5 flex items-center justify-between group"
              style={{ willChange: 'transform, opacity' }}
            >
              <span className="text-zinc-500 text-sm font-medium leading-snug max-w-[18ch]">
                {stat.label}
              </span>
              <span
                className="font-[700] text-white font-mono tracking-[-0.04em] ml-6 flex-shrink-0"
                style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}
              >
                {stat.value}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

/* ══════════════════════════════════════════════════════════════════
   SLIDE 03 — PROBLEM
══════════════════════════════════════════════════════════════════ */
const Slide03Problem = memo(function Slide03Problem() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="keynote-slide slide-03-ambient" id="slide-03">
      <div className="relative z-10 w-full max-w-5xl mx-auto space-y-10 px-2">
        {/* Headline */}
        <div className="text-center space-y-3">
          <motion.p
            initial={{ opacity: 0 }}
            animate={visible ? { opacity: 1 } : {}}
            transition={{ duration: 0.55 }}
            className="text-overline text-[#a78bfa] uppercase tracking-[0.2em]"
          >
            The Observability Blindspot
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-[700] tracking-[-0.035em] leading-[1.04] text-white"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3.75rem)', willChange: 'transform, opacity' }}
          >
            Traditional observability<br />
            <span className="text-zinc-500">cannot explain AI failures.</span>
          </motion.h2>
        </div>

        {/* Contrast Cards */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.85, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Blind APM */}
          <div className="p-6 rounded-[1.5rem] bg-white/[0.012] border border-white/[0.05] space-y-3 opacity-55">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              <span>Traditional APM</span>
              <span className="text-emerald-400/75 font-semibold">200 OK</span>
            </div>
            <p className="text-sm text-zinc-400 font-mono leading-relaxed">
              HTTP 200 · CPU 41% · Mem 1.2GB · p99 310ms
            </p>
            <p className="text-xs text-zinc-600 leading-relaxed">
              System metrics report perfect health while the agent loops silently
              or returns hallucinated claims.
            </p>
            {/* Fake "everything green" bars */}
            <div className="flex gap-1 pt-1">
              {[82, 100, 91, 100, 88].map((w, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full bg-emerald-500/25 flex-1"
                  style={{ maxWidth: `${w}%` }}
                />
              ))}
            </div>
          </div>

          {/* VOID Intelligence */}
          <div className="p-6 rounded-[1.5rem] bg-[#8b5cf6]/[0.05] border border-[#8b5cf6]/22 space-y-3 shadow-lg shadow-[#8b5cf6]/4">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#a78bfa] uppercase tracking-wider font-semibold">
              <span>VOID Telemetry Intelligence</span>
              <span className="text-red-400">Incident</span>
            </div>
            <p className="text-sm text-white font-mono font-semibold leading-relaxed">
              5 duplicate tool calls · 0 tools for weather claim
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Reconstructs prompt intent, reasoning spans, and tool
              execution side-effects from standard OpenTelemetry traces.
            </p>
            {/* Incident pulse */}
            <div className="flex items-center gap-2 pt-1">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
              <span className="text-[11px] font-mono text-red-400">
                Loop pattern detected — 99% confidence
              </span>
            </div>
          </div>
        </motion.div>

        {/* Insight line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={visible ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center text-sm text-zinc-500 font-medium"
        >
          The same HTTP 200 that hides an agent looping 5 times. The same metrics that miss a hallucination.
        </motion.p>
      </div>
    </section>
  );
});

/* ══════════════════════════════════════════════════════════════════
   SLIDE 04 — RESOLUTION + DEMO CTA
══════════════════════════════════════════════════════════════════ */
const Slide04Resolution = memo(function Slide04Resolution({
  onEnterDemo,
}: {
  onEnterDemo: () => void;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="keynote-slide slide-04-ambient" id="slide-04">
      {/* Ambient pulse */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full animate-breathe"
          style={{
            background: 'radial-gradient(circle, rgba(109,40,217,0.12) 0%, transparent 70%)',
            willChange: 'opacity',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto space-y-12 px-2">
        {/* VOID logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={visible ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <VoidLogo size={48} glow={true} />
        </motion.div>

        {/* Resolution statement */}
        <div className="space-y-4">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.95, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-[800] tracking-[-0.045em] leading-[1.0] text-white"
            style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', willChange: 'transform, opacity' }}
          >
            VOID changes that.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(1.05rem,2.2vw,1.35rem)] text-zinc-400 font-medium max-w-[46ch] mx-auto leading-relaxed"
            style={{ willChange: 'transform, opacity' }}
          >
            Instrument AI applications once with OpenTelemetry.
            Turn every trace into incident intelligence.
          </motion.p>
        </div>

        {/* Three pillars */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center justify-center gap-3 font-mono text-xs"
          style={{ willChange: 'transform, opacity' }}
        >
          {[
            { icon: <Layers className="w-3.5 h-3.5 text-[#8b5cf6]" />, label: 'One SDK' },
            { icon: <Cpu className="w-3.5 h-3.5 text-[#8b5cf6]" />, label: 'Zero overhead' },
            { icon: <Zap className="w-3.5 h-3.5 text-[#8b5cf6]" />, label: 'Instant intelligence' },
          ].map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.08] text-zinc-300"
            >
              {p.icon}
              <span>{p.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Enter Demo CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ willChange: 'transform, opacity' }}
        >
          <button
            onClick={onEnterDemo}
            className="group inline-flex items-center gap-3 px-9 py-4 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-semibold text-base transition-all duration-300 shadow-[0_0_50px_rgba(139,92,246,0.32)] hover:shadow-[0_0_70px_rgba(139,92,246,0.48)] btn-tactile"
          >
            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
            Enter Live Demo
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </button>

          <p className="mt-4 text-[11px] font-mono text-zinc-600 uppercase tracking-[0.18em]">
            Real SDK · Real OpenTelemetry · Real incidents
          </p>
        </motion.div>
      </div>
    </section>
  );
});

/* ══════════════════════════════════════════════════════════════════
   DEMO PRODUCT SHELL
══════════════════════════════════════════════════════════════════ */
function DemoProductShell({
  onBackToDeck,
}: {
  onBackToDeck: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [phase, setPhase] = useState<DiagnosisPhase>('idle');
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [pipelineState, setPipelineState] = useState<PipelineState>({});
  const [error, setError] = useState<string | null>(null);
  const [failedStage, setFailedStage] = useState<string | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  const scenario = SCENARIOS[activeIdx];
  const isRunning = phase === 'running-agent' || phase === 'analyzing' || phase === 'sampled';

  const connectSSE = useCallback((id: string) => {
    if (sseRef.current) sseRef.current.close();
    const url = `${SSE_BASE}/api/investigations/${id}/stream`;
    const es = new EventSource(url);
    sseRef.current = es;
    es.addEventListener('pipeline', (event) => {
      try {
        const ev: PipelineEvent = JSON.parse(event.data);
        setPipelineState((prev) => ({
          ...prev,
          [ev.stage]: { status: ev.status, detail: ev.detail, subStep: ev.subStep, timestamp: ev.timestamp },
        }));
        if (ev.status === 'failed') {
          setFailedStage(ev.stage);
          setError(ev.detail ?? `${ev.stage} failed`);
          setPhase('failed');
          es.close();
        } else if (ev.stage === 'COMPLETED' && ev.status === 'completed') {
          setPhase('complete');
          es.close();
        }
      } catch { /* skip malformed */ }
    });
    es.onerror = () => { es.close(); };
  }, []);

  useEffect(() => () => { if (sseRef.current) sseRef.current.close(); }, []);

  const { data: investigationData } = useQuery<InvestigationResponse>({
    queryKey: ['investigation', incidentId, 'result'],
    enabled: (phase === 'complete' || phase === 'failed') && !!incidentId,
    queryFn: async () => {
      const res = await fetch(`/api/investigations/${incidentId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  const { data: polledIncident } = useQuery<{ id: string } | null>({
    queryKey: ['incident-by-execution', executionId],
    queryFn: async () => {
      const res = await fetch(`/api/incidents/by-execution/${executionId}`);
      if (!res.ok) return null;
      const data = await res.json();
      console.log(`[poll] executionId=${executionId} count=${data.count} found=${data.count > 0 ? data.data[0]?.id : 'none'}`);
      return data.count > 0 ? data.data[0] : null;
    },
    enabled: phase === 'sampled' && !!executionId && !incidentId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (polledIncident?.id && phase === 'sampled') {
      setIncidentId(polledIncident.id);
      setPhase('analyzing');
      connectSSE(polledIncident.id);
    }
  }, [polledIncident, phase, connectSSE]);

  const [isResetting, setIsResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleReset = useCallback(async () => {
    if (isResetting || isRunning) return;
    setIsResetting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' });
      if (res.ok) {
        setResetDone(true);
        setPhase('idle');
        setIncidentId(null);
        setExecutionId(null);
        setPipelineState({});
        setError(null);
        setFailedStage(null);
        if (sseRef.current) sseRef.current.close();
        setTimeout(() => setResetDone(false), 3000);
      } else {
        setError('Failed to reset database & queues.');
      }
    } catch {
      setError('Network error resetting system state.');
    } finally {
      setIsResetting(false);
    }
  }, [isResetting, isRunning]);

  const handleSelectScenario = useCallback((idx: number) => {
    if (isRunning) return;
    setActiveIdx(idx);
    setPhase('idle');
    setActiveStepIndex(-1);
    setIncidentId(null);
    setExecutionId(null);
    setPipelineState({});
    setError(null);
    setFailedStage(null);
    if (sseRef.current) sseRef.current.close();
  }, [isRunning]);

  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setPhase('running-agent');
    setActiveStepIndex(0);
    setIncidentId(null);
    setPipelineState({});
    setError(null);
    setFailedStage(null);
    if (sseRef.current) sseRef.current.close();

    const STEP_MS = 750;
    for (let i = 1; i < scenario.agentSteps.length; i++) {
      await new Promise<void>(r => setTimeout(r, STEP_MS));
      setActiveStepIndex(i);
    }
    await new Promise<void>(r => setTimeout(r, 550));
    setPhase('analyzing');

    try {
      const res = await fetch('/api/agent/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            index: scenario.index,
            batch: scenario.index === 3 || scenario.index === 11 ? 20 : undefined,
          }),
        });
      const data = await res.json();
      if (data.success && data.incidentId) {
        setIncidentId(data.incidentId);
        setExecutionId(null);
        connectSSE(data.incidentId);
      } else if (data.success && data.sampled && data.executionId) {
        setExecutionId(data.executionId);
        setPhase('sampled');
      } else if (data.success && data.executionId) {
        setPhase('healthy');
      } else {
        setError(data.error ?? 'Investigation failed.');
        setPhase('failed');
      }
    } catch {
      setError('Network error.');
      setPhase('failed');
    }
  }, [isRunning, scenario, connectSSE]);

  return (
    <div className="demo-shell">
      <button onClick={onBackToDeck} className="back-pill" aria-label="Back to presentation deck">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Deck</span>
      </button>

      <div className="skip-pill" style={{ cursor: 'default' }}>
        <VoidLogo size={18} glow={false} />
        <span className="text-[#a78bfa]">Live Demo</span>
      </div>

      <div className="max-w-5xl mx-auto px-5 pt-24 pb-24 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-[#a78bfa]">
            <Sparkles className="w-3.5 h-3.5 text-[#8b5cf6]" />
            Interactive Product Demo
          </div>
          <h2 className="font-[700] tracking-[-0.035em] text-white leading-tight" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.75rem)' }}>
            Reconstruct a production incident
          </h2>
          <p className="text-sm text-zinc-400 max-w-[46ch] mx-auto leading-relaxed">
            Select an AI failure scenario below. VOID assembles the reasoning
            trace and delivers root-cause evidence in real time.
          </p>

          <div className="flex justify-center pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReset}
              disabled={isResetting || isRunning}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-red-500/10 via-violet-500/10 to-blue-500/10 hover:from-red-500/20 hover:via-violet-500/20 hover:to-blue-500/20 border border-white/10 hover:border-red-500/40 text-xs font-mono font-medium text-zinc-300 hover:text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                  <span>Resetting…</span>
                </>
              ) : resetDone ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Cleared!</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                  <span>Reset DB & Queues</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCENARIOS.map((s, idx) => {
            const isActive = activeIdx === idx;
            return (
              <button
                key={s.index}
                onClick={() => handleSelectScenario(idx)}
                disabled={isRunning}
                className={`p-4 rounded-[1.4rem] border text-left transition-all duration-300 btn-tactile disabled:opacity-40 disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-[#8b5cf6]/[0.07] border-[#8b5cf6]/40 text-white ring-1 ring-[#8b5cf6]/25 shadow-lg shadow-[#8b5cf6]/8'
                    : 'bg-white/[0.013] border-white/[0.055] text-zinc-400 hover:text-white hover:border-white/[0.11]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold font-mono text-[#a78bfa]">{s.pill}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    s.severity === 'critical'
                      ? 'bg-red-950/20 text-red-400 border-red-500/20'
                      : 'bg-amber-950/15 text-amber-300 border-amber-500/18'
                  }`}>
                    {s.severity}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-snug">{s.summary}</p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-5">
            <p className="text-xs font-mono text-zinc-500 tracking-wide uppercase">
              {phase === 'idle'
                ? 'Select a scenario and run investigation'
                : phase === 'complete'
                ? 'Execution captured'
                : 'Running agent execution…'}
            </p>

            <div className="double-bezel px-5 py-2 md:px-7 md:py-3 space-y-0 divide-y divide-white/[0.04]">
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

            <motion.button
              onClick={handleRun}
              disabled={isRunning}
              whileHover={{ scale: isRunning ? 1 : 1.01 }}
              whileTap={{ scale: isRunning ? 1 : 0.98 }}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-base font-semibold text-white transition-all duration-300 ${
                isRunning
                  ? 'bg-white/[0.04] cursor-not-allowed text-zinc-500'
                  : 'bg-[#8b5cf6] hover:bg-[#7c3aed] shadow-lg shadow-[#8b5cf6]/22 hover:shadow-[#8b5cf6]/36'
              }`}
            >
              <span>
                {phase === 'running-agent'
                  ? 'Emitting OpenTelemetry spans…'
                  : phase === 'analyzing'
                  ? 'Running backend investigation…'
                  : phase === 'sampled'
                  ? 'Trace selected for evaluation…'
                  : phase === 'failed'
                  ? 'Investigation completed with errors'
                  : 'Run Investigation'}
              </span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                {isRunning ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </div>
            </motion.button>
          </div>

          <div className="min-h-[200px]">
            <AnimatePresence mode="wait">
              {phase === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center justify-center gap-3 py-20 h-full text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                    <VoidLogo size={22} glow={false} />
                  </div>
                  <p className="text-xs font-mono text-zinc-600 max-w-[22ch] leading-relaxed">
                    Run an investigation to see incident intelligence appear here
                  </p>
                </motion.div>
              )}

              {(phase === 'analyzing' || phase === 'running-agent') && !incidentId && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center gap-4 py-20 h-full"
                >
                  <div className="flex items-center gap-2.5">
                    <VoidLogo size={20} glow={true} />
                    <span className="text-sm font-mono text-[#a78bfa]">
                      VOID is reconstructing trace intelligence
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ repeat: Infinity, duration: 0.75, delay: i * 0.17 }}
                        className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]"
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {phase === 'sampled' && (
                <motion.div
                  key="sampled"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center gap-4 py-20 h-full"
                >
                  <div className="flex items-center gap-2.5">
                    <VoidLogo size={20} glow={true} />
                    <span className="text-sm font-mono text-amber-400">
                      Trace sampled — evaluator running
                    </span>
                  </div>
                  <p className="text-xs font-mono text-zinc-500 max-w-[32ch] text-center leading-relaxed">
                    The trace was selected for adaptive sampling. Waiting for the evaluator to complete…
                  </p>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ repeat: Infinity, duration: 0.75, delay: i * 0.17 }}
                        className="w-1.5 h-1.5 rounded-full bg-amber-500"
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {phase === 'analyzing' && incidentId && (
                <motion.div
                  key="pipeline"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="text-xs font-mono text-zinc-500 tracking-wide uppercase mb-4">
                    Live Investigation Status
                  </p>
                  <InvestigationPipeline pipelineState={pipelineState} />
                </motion.div>
              )}

              {phase === 'complete' && (
                <CompletionCard
                  issueUrl={investigationData?.issueUrl ?? null}
                  signozTraceUrl={investigationData?.signozTraceUrl ?? null}
                />
              )}

              {phase === 'healthy' && (
                <motion.div
                  key="healthy"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-4 py-14 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-emerald-300">No issues detected</p>
                    <p className="text-xs font-mono text-zinc-500 max-w-[32ch] leading-relaxed">
                      The trace was evaluated as healthy. No investigation needed.
                    </p>
                  </div>
                </motion.div>
              )}

              {phase === 'failed' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-4 py-14 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-red-300">
                      {failedStage ? `${failedStage.replace(/_/g, ' ')} Failed` : 'Investigation Failed'}
                    </p>
                    <p className="text-xs font-mono text-red-400/70 max-w-[36ch] leading-relaxed">
                      {failedStage ? getStageErrorMessage(failedStage, error ?? undefined) : error}
                    </p>
                  </div>
                  <p className="text-[11px] text-zinc-600 font-mono">
                    The incident has been preserved. Please retry or inspect server logs.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.05] space-y-8">
          <div className="text-center space-y-3">
            <p className="text-overline text-[#a78bfa] uppercase tracking-[0.2em]">Architecture Vision</p>
            <h3 className="font-[700] tracking-[-0.03em] text-white leading-tight" style={{ fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)' }}>
              The SDK stays untouched. Only the consumer transforms.
            </h3>
            <p className="text-sm text-zinc-400 max-w-[48ch] mx-auto leading-relaxed">
              See how VOID evolves from today's deterministic analyzer into tomorrow's autonomous incident server.
            </p>
          </div>

          <div className="p-6 md:p-8 rounded-3xl bg-white/[0.014] border border-white/[0.07] space-y-4 text-left">
            <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
              <span>SDK Instrumentation → Backend Pipeline → Engineering Report</span>
            </div>
            <h4 className="text-base font-bold text-white">Real Backend Investigation Pipeline</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">
              OpenTelemetry spans flow into the VOID Server which runs risk evaluation,
              incident formation, LLM evaluator, promotion gate, and issue agent —
              producing a canonical engineering report from real backend processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   NAVIGATION DOTS
══════════════════════════════════════════════════════════════════ */
const NavDots = memo(function NavDots({
  total,
  current,
  onChange,
}: {
  total: number;
  current: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="nav-dots" role="navigation" aria-label="Slide navigation">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          aria-label={`Go to slide ${i + 1}`}
          className={`nav-dot ${current === i ? 'active' : ''}`}
        />
      ))}
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════════
   ROOT PRESENTATION COMPONENT
══════════════════════════════════════════════════════════════════ */
export const KeynotePresentation: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mode, setMode] = useState<PresentationMode>('slides');

  const goTo = useCallback((idx: number) => {
    setCurrentSlide(Math.max(0, Math.min(TOTAL_SLIDES - 1, idx)));
  }, []);

  const goNext = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);
  const goPrev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);

  const enterDemo = useCallback(() => {
    setMode('demo');
  }, []);

  const exitDemo = useCallback(() => {
    setMode('slides');
    setCurrentSlide(3); // Return to slide 04 (Resolution)
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (mode !== 'slides') return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode, goNext, goPrev]);

  // Touch swipe for slides
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  }, [goNext, goPrev]);

  return (
    <div className="presentation-root">
      {/* Grain overlay — fixed, GPU-safe */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* ─── PRESENTATION MODE ─── */}
      <AnimatePresence mode="wait">
        {mode === 'slides' && (
          <motion.div
            key="slides"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Slide track */}
            <motion.div
              className="slide-track"
              animate={{ x: `-${currentSlide * 100}vw` }}
              transition={SLIDE_SPRING}
              style={{ willChange: 'transform' }}
            >
              <Slide01Hero onEnterDemo={enterDemo} onNext={goNext} />
              <Slide02Production />
              <Slide03Problem />
              <Slide04Resolution onEnterDemo={enterDemo} />
            </motion.div>

            {/* Skip to demo pill */}
            <AnimatePresence>
              {currentSlide < 3 && (
                <motion.button
                  key="skip-pill"
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  onClick={enterDemo}
                  className="skip-pill"
                  aria-label="Skip to live demo"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
                  Skip to Live Demo
                </motion.button>
              )}
            </AnimatePresence>

            {/* Left arrow */}
            <AnimatePresence>
              {currentSlide > 0 && (
                <motion.button
                  key="arrow-left"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={goPrev}
                  className="slide-arrow left"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Right arrow */}
            <AnimatePresence>
              {currentSlide < TOTAL_SLIDES - 1 && (
                <motion.button
                  key="arrow-right"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={goNext}
                  className="slide-arrow right"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Navigation dots */}
            <NavDots
              total={TOTAL_SLIDES}
              current={currentSlide}
              onChange={goTo}
            />
          </motion.div>
        )}

        {/* ─── DEMO MODE ─── */}
        {mode === 'demo' && (
          <motion.div
            key="demo"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <DemoProductShell onBackToDeck={exitDemo} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
