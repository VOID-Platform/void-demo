'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { VoidLogo } from '@/components/VoidLogo';

/* ─────────────────────────────────────────────────────────────────
   SCROLL-REVEAL WRAPPER
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
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ willChange: 'transform, opacity' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   FAILURE MODES (compact, no full-viewport bloat)
   ───────────────────────────────────────────────────────────────── */
const failures = [
  'Wrong tool selection',
  'Hallucinated responses',
  'Silent mid-task crashes',
  'Recursive API loops',
  'Uncontrolled token burn',
];

/* ─────────────────────────────────────────────────────────────────
   INTRO HOOK — TWO SECTIONS, THEN DONE
   
   Section 1: Hero — The hook + problem statement
   Section 2: VOID Reveal — Product + CTA to start the demo
   
   That's it. No presentation→presentation→presentation.
   ───────────────────────────────────────────────────────────────── */
interface IntroHookProps {
  onComplete: () => void;
}

export const IntroHook: React.FC<IntroHookProps> = ({ onComplete }) => {
  return (
    <div className="relative">

      {/* ━━━ SECTION 1: HERO — Hook + Problem ━━━ */}
      <section className="section-viewport ambient-hero relative" id="hero">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#7c3aed]/[0.05] blur-[160px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-12">
          {/* Opening statement */}
          <div className="space-y-4">
            <Reveal>
              <h1 className="text-display-xl text-white">
                AI agents are entering production.
              </h1>
            </Reveal>

            <Reveal delay={0.25}>
              <p className="text-display-lg text-zinc-500 max-w-4xl mx-auto">
                They don't fail like traditional software.
              </p>
            </Reveal>
          </div>

          {/* Failure modes — compact horizontal list, not 5 separate sections */}
          <Reveal delay={0.5}>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 pt-4">
              {failures.map((f, idx) => (
                <motion.span
                  key={f}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + idx * 0.12, duration: 0.5 }}
                  className="text-sm text-red-400/70 font-medium"
                >
                  {f}
                </motion.span>
              ))}
            </div>
          </Reveal>

          {/* The question */}
          <Reveal delay={0.8}>
            <motion.h2
              className="text-display-xl bg-gradient-to-r from-[#a78bfa] via-[#8b5cf6] to-[#7c3aed] bg-clip-text text-transparent pt-6"
              initial={{ filter: 'blur(6px)' }}
              whileInView={{ filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              How do you know why?
            </motion.h2>
          </Reveal>
        </div>

        {/* Scroll indicator */}
        <Reveal delay={1.2} className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-white/20" />
          </motion.div>
        </Reveal>
      </section>

      {/* ━━━ SECTION 2: VOID REVEAL — Product + CTA ━━━ */}
      <section className="section-viewport ambient-center relative" id="reveal">
        {/* Ambient radial */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full animate-pulse-glow pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 65%)' }} />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-10">
          <Reveal>
            <motion.div
              className="mx-auto mb-2"
              initial={{ scale: 0.6, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                type: 'spring',
                stiffness: 80,
                damping: 15,
                mass: 0.8,
              }}
            >
              <VoidLogo size={72} glow={true} />
            </motion.div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-[clamp(4rem,10vw,8rem)] font-bold tracking-[-0.05em] text-white leading-none">
              VOID
            </h1>
          </Reveal>

          <div className="space-y-3">
            <Reveal delay={0.2}>
              <p className="text-xl md:text-2xl text-white font-medium">
                Instrument AI applications once.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="text-xl md:text-2xl text-zinc-400">
                Capture every execution with OpenTelemetry.
              </p>
            </Reveal>
            <Reveal delay={0.4}>
              <p className="text-xl md:text-2xl text-[#a78bfa] font-semibold">
                Turn telemetry into incident intelligence.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.55}>
            <button
              onClick={onComplete}
              className="mt-4 px-8 py-3.5 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-semibold text-base transition-all duration-300 shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:shadow-[0_0_60px_rgba(139,92,246,0.4)] inline-flex items-center gap-3 btn-tactile"
            >
              <span>Watch VOID diagnose a failure</span>
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
