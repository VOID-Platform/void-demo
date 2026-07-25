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
  useMotionValue,
  useSpring,
} from 'framer-motion';
import {
  Play,
  ChevronDown,
  ExternalLink,
  GitPullRequest,
  XCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  Cpu,
  Zap,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
} from 'lucide-react';
import { VoidLogo } from '@/components/VoidLogo';
import { ExecutionTrace, IncidentReport } from '@/lib/types';
import { WalkthroughModal } from '@/components/WalkthroughModal';

/* ══════════════════════════════════════════════════════════════════
   CONSTANTS & DATA
══════════════════════════════════════════════════════════════════ */

const TOTAL_SLIDES = 4;

const SCENARIOS = [
  {
    index: 6,
    pill: 'Recursive API Loop',
    severity: 'critical' as const,
    summary: 'github.createIssue executed 5 consecutive times in 710ms',
    agentSteps: [
      { label: 'Task received', detail: 'Escalate high-priority sync bug to engineering' },
      { label: 'Planning', detail: 'Identified escalation path → github.createIssue' },
      { label: 'Tool execution', detail: 'github.createIssue called × 5 — identical parameters', isError: true },
      { label: 'Loop detected', detail: 'Five duplicate issues created in 710ms', isError: true },
    ],
  },
  {
    index: 4,
    pill: 'Silent Hallucination',
    severity: 'warning' as const,
    summary: 'Weather claim returned with zero tools invoked',
    agentSteps: [
      { label: 'Task received', detail: 'What is the weather in Paris?' },
      { label: 'Planning', detail: 'Parsed weather query — tool lookup expected' },
      { label: 'Tools skipped', detail: 'Generated response without calling any weather API', isError: true },
      { label: 'Response emitted', detail: '"The weather in Paris is 25°C." — unverified claim' },
    ],
  },
  {
    index: 8,
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
    index: 9,
    pill: 'Execution Crash',
    severity: 'critical' as const,
    summary: 'Agent process crashed mid-stream during Stripe seat update',
    agentSteps: [
      { label: 'Task received', detail: 'Process automated seat upgrade for team billing' },
      { label: 'Pre-flight checks', detail: 'Validated billing permissions and org balance' },
      { label: 'TLS crash', detail: 'stripe.updateQuantity — ConnectionResetError during TLS', isError: true },
      { label: 'Span never emitted', detail: 'Agent died mid-stream — billing state ambiguous', isError: true },
    ],
  },
] as const;

const SEVERITY_CFG = {
  critical: {
    color: 'text-red-400',
    bg: 'bg-red-950/20',
    border: 'border-red-500/25',
    dot: 'bg-red-400',
    label: 'Critical Incident',
  },
  warning: {
    color: 'text-amber-300',
    bg: 'bg-amber-950/15',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
    label: 'Warning',
  },
  success: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/15',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
    label: 'Normal Operations',
  },
};

type DiagnosisPhase = 'idle' | 'running-agent' | 'analyzing' | 'complete';
type PresentationMode = 'slides' | 'demo';

/* ══════════════════════════════════════════════════════════════════
   SPRING EASING (for slide transitions)
══════════════════════════════════════════════════════════════════ */
const SLIDE_SPRING = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 38,
  mass: 0.9,
};

/* ══════════════════════════════════════════════════════════════════
   ANIMATED COUNT UP HOOK
══════════════════════════════════════════════════════════════════ */
function useCountUp(target: number, duration = 1.2, trigger = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) { setCount(0); return; }
    let start = 0;
    const inc = target / (duration * 60);
    const iv = setInterval(() => {
      start += inc;
      if (start >= target) { setCount(target); clearInterval(iv); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(iv);
  }, [target, duration, trigger]);
  return count;
}

/* ══════════════════════════════════════════════════════════════════
   TYPING LINE — character-by-character reveal
══════════════════════════════════════════════════════════════════ */
const TypingLine = memo(function TypingLine({
  text,
  delay,
  className = '',
}: {
  text: string;
  delay: number;
  className?: string;
}) {
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
    }, 13);
    return () => clearInterval(iv);
  }, [started, text]);

  if (!started && !displayed) return null;
  return (
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={className}>
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-[#8b5cf6] ml-[2px] align-middle animate-cursor-blink" />
      )}
    </motion.p>
  );
});

/* ══════════════════════════════════════════════════════════════════
   AGENT STEP LINE
══════════════════════════════════════════════════════════════════ */
interface AgentStep { label: string; detail: string; isError?: boolean; }

const AgentStepLine = memo(function AgentStepLine({
  step,
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
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: isReached ? 1 : 0.15, x: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-4 py-3.5"
    >
      {/* Status indicator */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all duration-500 ${
        isActive
          ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/40'
          : isBad || (isDone && step.isError)
          ? 'bg-red-500/10 border-red-500/25'
          : isDone
          ? 'bg-emerald-500/5 border-emerald-500/18'
          : 'bg-white/[0.02] border-white/[0.04]'
      }`}>
        {isActive ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
            className="w-3 h-3 border-2 border-[#8b5cf6] border-t-transparent rounded-full"
          />
        ) : isBad || (isDone && step.isError) ? (
          <XCircle className="w-3.5 h-3.5 text-red-400" />
        ) : isDone ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/80" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium transition-colors duration-300 ${
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
            className={`text-xs font-mono mt-0.5 leading-snug ${
              isBad || (isDone && step.isError) ? 'text-red-400/65' : 'text-zinc-500'
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
   SLIDE 01 — VOID HERO
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
            <ArrowRight className="w-3.5 h-3.5" />
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
  isWalkthroughOpen,
  onOpenWalkthrough,
  onCloseWalkthrough,
}: {
  onBackToDeck: () => void;
  isWalkthroughOpen: boolean;
  onOpenWalkthrough: () => void;
  onCloseWalkthrough: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [phase, setPhase] = useState<DiagnosisPhase>('idle');
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [trace, setTrace] = useState<ExecutionTrace | null>(null);
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [architectureMode, setArchitectureMode] = useState<'today' | 'tomorrow'>('today');
  const [error, setError] = useState<string | null>(null);

  const scenario = SCENARIOS[activeIdx];
  const isRunning = phase === 'running-agent' || phase === 'analyzing';
  const cfg = report ? SEVERITY_CFG[report.severity] : null;
  const animatedConfidence = useCountUp(
    report ? report.confidence : 0,
    1.2,
    phase === 'complete'
  );
  const T = { ev0: 400, ev1: 1100, ev2: 1800, rec: 2600 };

  const handleSelectScenario = useCallback((idx: number) => {
    if (isRunning) return;
    setActiveIdx(idx);
    setPhase('idle');
    setActiveStepIndex(-1);
    setTrace(null);
    setReport(null);
    setEvidenceOpen(false);
    setError(null);
  }, [isRunning]);

  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setError(null);
    setPhase('running-agent');
    setActiveStepIndex(0);
    setTrace(null);
    setReport(null);
    setEvidenceOpen(false);

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
      await new Promise<void>(r => setTimeout(r, 400));
      setTrace(data.trace);
      setReport(data.report);
      setPhase('complete');
    } catch (err) {
      setError(err instanceof TypeError ? 'Network error — unable to reach the investigation service.' : 'Unexpected error during investigation.');
      setPhase('idle');
    }
  }, [isRunning, scenario]);

  return (
    <div className="demo-shell">
      {/* Back-to-deck pill */}
      <button
        onClick={onBackToDeck}
        className="back-pill"
        aria-label="Back to presentation deck"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Deck</span>
      </button>

      {/* VOID logo pill — top right */}
      <div className="skip-pill" style={{ cursor: 'default' }}>
        <VoidLogo size={18} glow={false} />
        <span className="text-[#a78bfa]">Live Demo</span>
      </div>

      {/* Demo content */}
      <div className="max-w-5xl mx-auto px-5 pt-24 pb-24 space-y-10">
        {/* Section header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-[#a78bfa]">
            <Sparkles className="w-3.5 h-3.5 text-[#8b5cf6]" />
            Interactive Product Demo
          </div>
          <h2
            className="font-[700] tracking-[-0.035em] text-white leading-tight"
            style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.75rem)' }}
          >
            Reconstruct a production incident
          </h2>
          <p className="text-sm text-zinc-400 max-w-[46ch] mx-auto leading-relaxed">
            Select an AI failure scenario below. VOID assembles the reasoning
            trace and delivers root-cause evidence in real time.
          </p>
        </div>

        {/* Scenario selector */}
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

        {/* ── Horizontal: Execution LEFT + Analysis RIGHT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── LEFT: Execution trace ── */}
          <div className="space-y-5">
            <p className="text-xs font-mono text-zinc-500 tracking-wide uppercase">
              {phase === 'idle'
                ? 'Select a scenario and run investigation'
                : phase === 'complete'
                ? 'Execution captured'
                : 'Running agent execution…'}
            </p>

            {/* Agent steps */}
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

            {/* Run button */}
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
                  ? 'Analyzing failure patterns…'
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

          {/* ── RIGHT: Analysis result ── */}
          <div className="min-h-[200px]">
            <AnimatePresence mode="wait">
              {phase === 'analyzing' && !report && (
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

              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center gap-3 py-14 h-full text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-red-950/20 border border-red-500/20 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-xs font-mono text-red-400 max-w-[30ch] leading-relaxed">
                    {error}
                  </p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}

              {phase === 'idle' && !error && (
                <motion.div
                  key="idle-placeholder"
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

              {phase === 'complete' && report && trace && cfg && (
                <motion.div
                  key={`${trace.id}-complete`}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-8 bg-white/[0.018] border border-white/[0.07] rounded-3xl p-6 shadow-2xl relative overflow-hidden"
                >
                  {/* Ambient glow */}
                  <div className="absolute top-0 right-0 w-[280px] h-[280px] bg-[#8b5cf6]/[0.03] rounded-full blur-3xl pointer-events-none" />

                  {/* Severity + confidence */}
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                        {cfg.label}
                      </div>

                      {/* Confidence meter */}
                      <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.07]">
                        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Confidence</span>
                        <div className="w-14 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: `${animatedConfidence}%` }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-[#a78bfa]">
                          {animatedConfidence}%
                        </span>
                      </div>
                    </div>

                    <TypingLine
                      text={report.incident}
                      delay={0}
                      className="text-lg font-bold text-white leading-tight tracking-tight"
                    />
                  </div>


                  {/* ── Full Engineering Analysis Report ── */}
                  {report.engineeringReport && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="relative z-10"
                    >
                      {/* Panel header */}
                      <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-6 h-6 rounded-lg bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 flex items-center justify-center flex-shrink-0">
                          <Cpu className="w-3.5 h-3.5 text-[#a78bfa]" />
                        </div>
                        <span className="text-sm font-semibold text-white tracking-tight">
                          Engineering Analysis Report
                        </span>
                        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                          {report.analysisSource === 'server_evaluated' ? (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                              <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-[0.18em]">Server Evaluated</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                              <span className="text-[9px] font-mono text-amber-400 uppercase tracking-[0.18em]">Local Heuristic</span>
                            </span>
                          )}
                        </div>
                      </div>


                      {/* Scrollable document body */}
                      <div
                        className="report-scroll rounded-2xl border border-white/[0.06] divide-y divide-white/[0.05]"
                        style={{ maxHeight: '60vh' }}
                      >
                        {report.engineeringReport.fullReport ? (
                          <pre className="p-5 text-[0.8rem] text-zinc-200 font-mono leading-relaxed whitespace-pre-wrap break-words">
                            {report.engineeringReport.fullReport}
                          </pre>
                        ) : (
                          <>
                            {/* Executive Summary */}
                            {(report.engineeringReport.executive_summary || report.engineeringReport.summary) && (
                              <div className="px-5 py-4 bg-white/[0.01] hover:bg-white/[0.025] transition-colors">
                                <p className="text-[9px] font-mono text-[#a78bfa] uppercase tracking-[0.22em] mb-1.5">Executive Summary</p>
                                <p className="text-[0.83rem] text-zinc-200 leading-relaxed">
                                  {report.engineeringReport.executive_summary || report.engineeringReport.summary}
                                </p>
                              </div>
                            )}

                            {/* Impact */}
                            {report.engineeringReport.impact && (
                              <div className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                <p className="text-[9px] font-mono text-red-400/70 uppercase tracking-[0.22em] mb-1.5">Impact</p>
                                <p className="text-[0.83rem] text-red-200 leading-relaxed font-medium">{report.engineeringReport.impact}</p>
                              </div>
                            )}

                            {/* Root Cause */}
                            {report.engineeringReport.root_cause && (
                              <div className="px-5 py-4 bg-[#8b5cf6]/[0.03] hover:bg-[#8b5cf6]/[0.06] transition-colors">
                                <p className="text-[9px] font-mono text-[#a78bfa] uppercase tracking-[0.22em] mb-1.5">Root Cause</p>
                                <p className="text-[0.83rem] text-zinc-100 leading-relaxed font-semibold">
                                  {report.engineeringReport.root_cause}
                                </p>
                              </div>
                            )}

                            {/* Forensic Evidence */}
                            {report.evidence && report.evidence.length > 0 && (
                              <div className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.22em] mb-2">Forensic Evidence</p>
                                <ul className="space-y-2">
                                  {report.evidence.map((ev, i) => (
                                    <li key={i} className="flex items-start gap-2.5">
                                      <span className="w-1 h-1 rounded-full bg-[#8b5cf6]/60 mt-[0.45rem] flex-shrink-0" />
                                      <span className="text-[0.8rem] text-zinc-300 leading-relaxed">{ev}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Suspected Components */}
                            {report.engineeringReport.suspected_components && report.engineeringReport.suspected_components.length > 0 && (
                              <div className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.22em] mb-2">Suspected Components</p>
                                <ul className="space-y-1.5">
                                  {report.engineeringReport.suspected_components.map((comp, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                      <span className="w-1 h-1 rounded-full bg-amber-400/50 flex-shrink-0" />
                                      <span className="font-mono text-[0.78rem] text-amber-200/80">{comp}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Relevant Files */}
                            {report.engineeringReport.relevant_files && report.engineeringReport.relevant_files.length > 0 && (
                              <div className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.22em] mb-2">Relevant Files</p>
                                <ul className="space-y-1.5">
                                  {report.engineeringReport.relevant_files.map((f, i) => (
                                    <li key={i} className="font-mono text-[0.75rem] text-[#a78bfa] pl-3 border-l border-[#8b5cf6]/30">{f}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Suggested Fix */}
                            {report.engineeringReport.suggested_fix && (
                              <div className="px-5 py-4 bg-emerald-950/10 hover:bg-emerald-950/20 transition-colors">
                                <p className="text-[9px] font-mono text-emerald-400/70 uppercase tracking-[0.22em] mb-2">Suggested Fix</p>
                                <p className="font-mono text-[0.78rem] text-emerald-300 leading-relaxed whitespace-pre-wrap">
                                  {report.engineeringReport.suggested_fix}
                                </p>
                              </div>
                            )}

                            {/* Actionable Recommendation */}
                            {report.recommendation && (
                              <div className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.22em] mb-1.5">Actionable Recommendation</p>
                                <p className="text-[0.83rem] text-zinc-200 leading-relaxed font-medium">{report.recommendation}</p>
                              </div>
                            )}

                            {/* Suggested Tests */}
                            {report.engineeringReport.suggested_tests && report.engineeringReport.suggested_tests.length > 0 && (
                              <div className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.22em] mb-2">Suggested Tests</p>
                                <ul className="space-y-1.5">
                                  {report.engineeringReport.suggested_tests.map((t, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                      <span className="w-1 h-1 rounded-full bg-zinc-600 flex-shrink-0" />
                                      <span className="font-mono text-[0.75rem] text-zinc-400">{t}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Execution Timeline */}
                            {report.timeline && report.timeline.length > 0 && (
                              <div className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.22em] mb-2">Execution Timeline</p>
                                <div className="space-y-0">
                                  {report.timeline.map((entry, i) => (
                                    <div key={i} className="flex items-start gap-3 py-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 mt-[0.35rem] flex-shrink-0" />
                                      <span className="font-mono text-[0.72rem] text-zinc-500 leading-snug">{entry}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Sampling / Disclaimer */}
                            {(report.samplingInfo || report.disclaimer) && (
                              <div className="px-5 py-3 bg-white/[0.008]">
                                {report.samplingInfo && (
                                  <p className="text-[0.68rem] font-mono text-zinc-600 mb-0.5">{report.samplingInfo}</p>
                                )}
                                {report.disclaimer && (
                                  <p className="text-[0.65rem] font-mono text-zinc-700 leading-snug">{report.disclaimer}</p>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* OpenTelemetry spans inspector */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 3.0, duration: 0.5 }}
                    className="relative z-10"
                  >
                    <button
                      onClick={() => setEvidenceOpen(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.11] transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors font-medium">
                          {evidenceOpen ? 'Hide spans' : 'Inspect spans'}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-600">
                          ({trace.steps.length} captured)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`http://localhost:8080/trace/${trace.traceId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-[10px] font-mono text-zinc-500 hover:text-[#a78bfa] transition-colors flex items-center gap-1 px-2 py-0.5 rounded border border-white/[0.04] hover:border-[#8b5cf6]/28"
                        >
                          SigNoz <ExternalLink className="w-2 h-2" />
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
                          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 space-y-1">
                            {trace.steps.map((step, idx) => (
                              <div
                                key={step.id}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono ${
                                  step.status === 'error'
                                    ? 'bg-red-950/14 border border-red-500/18 text-red-300'
                                    : 'bg-white/[0.013] border border-white/[0.04] text-zinc-400'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-zinc-700 text-[10px] w-4 flex-shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                                  <span className="truncate text-[10px]">{step.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 flex-shrink-0 ml-2">
                                  <span className="font-mono">{step.durationMs}ms</span>
                                  <span className={`px-1.5 py-0.5 rounded ${
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Vision section */}
        <div className="pt-8 border-t border-white/[0.05] space-y-8">
          <div className="text-center space-y-3">
            <p className="text-overline text-[#a78bfa] uppercase tracking-[0.2em]">Architecture Vision</p>
            <h3
              className="font-[700] tracking-[-0.03em] text-white leading-tight"
              style={{ fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)' }}
            >
              The SDK stays untouched. Only the consumer transforms.
            </h3>
            <p className="text-sm text-zinc-400 max-w-[48ch] mx-auto leading-relaxed">
              See how VOID evolves from today's deterministic analyzer into tomorrow's autonomous incident server.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex justify-center">
            <div className="p-1 rounded-full bg-white/[0.03] border border-white/[0.07] flex items-center gap-1 font-mono text-xs">
              <button
                onClick={() => setArchitectureMode('today')}
                className={`px-4 py-2 rounded-full transition-all duration-300 ${
                  architectureMode === 'today'
                    ? 'bg-[#8b5cf6] text-white font-semibold shadow-md'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Today: Analyzer
              </button>
              <button
                onClick={() => setArchitectureMode('tomorrow')}
                className={`px-4 py-2 rounded-full transition-all duration-300 ${
                  architectureMode === 'tomorrow'
                    ? 'bg-emerald-500 text-black font-semibold shadow-md'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Tomorrow: VOID Server
              </button>
            </div>
          </div>

          {/* Architecture panel */}
          <AnimatePresence mode="wait">
            {architectureMode === 'today' ? (
              <motion.div
                key="today"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.38 }}
                className="p-6 md:p-8 rounded-3xl bg-white/[0.014] border border-white/[0.07] space-y-4 text-left"
              >
                <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                  <span>SDK Instrumentation → DemoIncidentAnalyzer → Incident Intelligence</span>
                </div>
                <h4 className="text-base font-bold text-white">Deterministic Incident Analyzer</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Standard OpenTelemetry spans flow into{' '}
                  <code className="text-[#a78bfa] font-mono">DemoIncidentAnalyzer</code>{' '}
                  which interprets reasoning loops, hallucination anomalies, and TLS socket crashes in real time.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="tomorrow"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.38 }}
                className="p-6 md:p-8 rounded-3xl bg-emerald-950/14 border border-emerald-500/20 space-y-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs font-mono text-emerald-400">
                    <GitPullRequest className="w-4 h-4" />
                    <span>Autonomous Remediation Server</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/28 px-2.5 py-0.5 rounded-full">
                    Zero SDK Changes
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">VOID Autonomous Server</h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  VOID Server replaces only the consumer. The exact same OpenTelemetry spans automatically
                  create GitHub issues (<code className="text-emerald-400 font-mono">novaflow/core#402</code>),
                  file Linear tickets (<code className="text-emerald-400 font-mono">LIN-402</code>), and
                  dispatch PagerDuty incidents — without changing a single line of upstream application code.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Walkthrough modal */}
      <WalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={onCloseWalkthrough}
        onSelectTraceIndex={(index) => {
          const matchIdx = SCENARIOS.findIndex((s) => s.index === index);
          if (matchIdx !== -1) handleSelectScenario(matchIdx);
        }}
      />
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
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);

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
            <DemoProductShell
              onBackToDeck={exitDemo}
              isWalkthroughOpen={isWalkthroughOpen}
              onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
              onCloseWalkthrough={() => setIsWalkthroughOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
