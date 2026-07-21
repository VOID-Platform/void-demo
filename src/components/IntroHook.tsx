'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, FastForward, ArrowRight, AlertTriangle, FileText, BarChart2, Activity, Terminal, ShieldAlert } from 'lucide-react';
import { VoidLogo } from '@/components/VoidLogo';

interface IntroHookProps {
  onComplete: () => void;
}

const appleSpring = {
  type: 'spring',
  stiffness: 90,
  damping: 18,
  mass: 0.8,
};

const pageVariants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
};

export const IntroHook: React.FC<IntroHookProps> = ({ onComplete }) => {
  // Keynote Act State: 1 | 2 | 3 | 4 | 5
  const [act, setAct] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [act1Sentence, setAct1Sentence] = useState<1 | 2>(1);
  const [act2Branches, setAct2Branches] = useState<number>(0);
  const [act4DimCount, setAct4DimCount] = useState<number>(0);

  // Auto-play timeline orchestration
  useEffect(() => {
    if (act === 1) {
      const t1 = setTimeout(() => setAct1Sentence(2), 2600);
      const t2 = setTimeout(() => setAct(2), 5600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    if (act === 2) {
      if (act2Branches < 5) {
        const t = setTimeout(() => {
          setAct2Branches((prev) => prev + 1);
        }, 900);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setAct(3), 3800);
        return () => clearTimeout(t);
      }
    }

    if (act === 3) {
      const t = setTimeout(() => setAct(4), 3800);
      return () => clearTimeout(t);
    }

    if (act === 4) {
      if (act4DimCount < 3) {
        const t = setTimeout(() => {
          setAct4DimCount((prev) => prev + 1);
        }, 1300);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setAct(5), 3200);
        return () => clearTimeout(t);
      }
    }
  }, [act, act2Branches, act4DimCount]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      const isInteractive = targetTag === 'BUTTON' || targetTag === 'A' || targetTag === 'INPUT';

      if (e.key === ' ' || e.key === 'ArrowRight') {
        if (e.key === ' ' && isInteractive) return;
        e.preventDefault();
        if (act < 5) setAct((prev) => (prev + 1) as any);
        else onComplete();
      } else if (e.key === 'ArrowLeft') {
        if (isInteractive) return;
        e.preventDefault();
        if (act > 1) setAct((prev) => (prev - 1) as any);
      } else if (e.key === 'Escape') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [act, onComplete]);

  const topBranches = [
    { title: 'Wrong Tool Selection', desc: 'Called slack.sendMessage instead of github.createIssue' },
    { title: 'Hallucinated Responses', desc: 'Answered "25°C in Paris" with ZERO tools invoked' },
  ];

  const middleBranch = {
    title: 'Fails Midway Through Tasks',
    desc: 'Tool execution crashed mid-stream without completion span',
  };

  const bottomBranches = [
    { title: 'Unnecessary Looping', desc: 'Executed identical API endpoint 5 consecutive times' },
    { title: 'Excessive Token Usage', desc: 'Bloated prompt context consumed >6,500 input tokens' },
  ];

  const existingTools = [
    { title: 'Logs', icon: <FileText className="w-5 h-5 text-zinc-400" />, label: 'Not enough context' },
    { title: 'Metrics', icon: <BarChart2 className="w-5 h-5 text-zinc-400" />, label: 'Cannot explain reasoning' },
    { title: 'Infrastructure Traces', icon: <Activity className="w-5 h-5 text-zinc-400" />, label: 'Cannot reconstruct AI execution' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#070709] bg-tech-grid text-white flex flex-col justify-between p-6 md:p-12 overflow-x-hidden overflow-y-auto select-none">
      {/* Background Radial Logo Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-radial-gradient from-[#A855F7]/12 via-[#DF00FF]/05 to-transparent blur-[140px] pointer-events-none" />

      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between z-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <VoidLogo size={24} glow={false} />
          <span className="text-xs font-mono font-medium px-3.5 py-1 rounded-full bg-[#0E0E12] text-zinc-300 border border-white/10">
            KEYNOTE_ACT_0{act} / 05
          </span>
        </div>

        <button
          onClick={onComplete}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#0E0E12] border border-white/10 hover:border-[#A855F7]/50 text-zinc-300 hover:text-white text-xs font-mono transition-all btn-tactile"
        >
          <span>SKIP_TO_DEMO</span>
          <FastForward className="w-3.5 h-3.5 text-[#A855F7]" />
        </button>
      </div>

      {/* Center Presentation Stage */}
      <div className="flex-1 flex items-center justify-center max-w-6xl mx-auto w-full text-center z-10 px-4 my-auto relative">
        <AnimatePresence mode="popLayout">
          {/* ACT 1: PRODUCTION AI */}
          {act === 1 && (
            <motion.div
              key="act1"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ willChange: 'transform, opacity' }}
              className="space-y-8 max-w-4xl w-full"
            >
              <AnimatePresence mode="wait">
                {act1Sentence === 1 ? (
                  <motion.h1
                    key="sentence1"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-sans text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-300 tracking-tight leading-[1.1]"
                  >
                    AI Agents are entering production.
                  </motion.h1>
                ) : (
                  <motion.h1
                    key="sentence2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-sans text-zinc-300 tracking-tight leading-[1.1]"
                  >
                    They don't fail like traditional software.
                  </motion.h1>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ACT 2: SYMMETRICAL 2-1-2 LAYOUT WITH VOID LOGO CENTRAL ORB */}
          {act === 2 && (
            <motion.div
              key="act2"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ willChange: 'transform, opacity' }}
              className="w-full space-y-6 max-w-4xl mx-auto"
            >
              {/* Central AI Agent Node featuring VOID Logo */}
              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="inline-block"
              >
                <div className="p-0.5 rounded-2xl bg-gradient-to-r from-[#DF00FF] via-[#A855F7] to-[#7E22CE] shadow-[0_0_50px_rgba(168,85,247,0.35)]">
                  <div className="flex items-center space-x-3.5 px-7 py-3 rounded-2xl bg-[#0E0E12] border border-white/10">
                    <VoidLogo size={28} />
                    <div className="text-left">
                      <div className="text-base font-bold font-sans text-white tracking-tight">AI Agent Telemetry Engine</div>
                      <div className="text-[11px] font-mono text-zinc-400">AGENT_STATUS: PRODUCTION_ACTIVE</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Symmetrical 2-1-2 Branching Grid */}
              <div className="space-y-4 max-w-4xl mx-auto text-left">
                {/* Top Row: 2 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topBranches.map((branch, idx) => {
                    const isVisible = act2Branches >= idx + 1;
                    if (!isVisible) return <div key={branch.title} className="h-20" />;

                    return (
                      <motion.div
                        key={branch.title}
                        initial={{ opacity: 0, y: -20, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={appleSpring}
                        style={{ willChange: 'transform, opacity' }}
                        className="p-5 rounded-xl bg-[#0E0E12]/90 border border-red-500/40 shadow-2xl backdrop-blur-xl hover:border-red-500/80 transition-all"
                      >
                        <div className="flex items-center space-x-2.5 text-red-400 font-bold font-sans text-sm mb-1">
                          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                          <span>{branch.title}</span>
                        </div>
                        <div className="text-zinc-300 font-sans text-xs md:text-sm leading-relaxed">{branch.desc}</div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* MIDDLE ROW: FAILS MIDWAY (CENTERED CARD) */}
                {act2Branches >= 3 ? (
                  <motion.div
                    key={middleBranch.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={appleSpring}
                    style={{ willChange: 'transform, opacity' }}
                    className="max-w-xl mx-auto p-5 rounded-xl bg-[#140C16]/95 border-2 border-red-500/60 shadow-[0_0_40px_rgba(239,68,68,0.25)] backdrop-blur-xl hover:border-red-500 transition-all text-center"
                  >
                    <div className="flex items-center justify-center space-x-2 text-red-400 font-extrabold font-sans text-base mb-1">
                      <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
                      <span>{middleBranch.title}</span>
                    </div>
                    <div className="text-zinc-200 font-sans text-xs md:text-sm leading-relaxed font-medium">
                      {middleBranch.desc}
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-20 max-w-xl mx-auto" />
                )}

                {/* Bottom Row: 2 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bottomBranches.map((branch, idx) => {
                    const isVisible = act2Branches >= idx + 4;
                    if (!isVisible) return <div key={branch.title} className="h-20" />;

                    return (
                      <motion.div
                        key={branch.title}
                        initial={{ opacity: 0, y: 20, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={appleSpring}
                        style={{ willChange: 'transform, opacity' }}
                        className="p-5 rounded-xl bg-[#0E0E12]/90 border border-red-500/40 shadow-2xl backdrop-blur-xl hover:border-red-500/80 transition-all"
                      >
                        <div className="flex items-center space-x-2.5 text-red-400 font-bold font-sans text-sm mb-1">
                          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                          <span>{branch.title}</span>
                        </div>
                        <div className="text-zinc-300 font-sans text-xs md:text-sm leading-relaxed">{branch.desc}</div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ACT 3: THE QUESTION */}
          {act === 3 && (
            <motion.div
              key="act3"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ willChange: 'transform, opacity' }}
              className="space-y-8 max-w-4xl w-full"
            >
              <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                PRODUCTION_OBSERVABILITY_GAP
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-sans text-white tracking-tight leading-tight">
                When this happens...
              </h1>
              <h2 className="text-5xl sm:text-7xl md:text-8xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-r from-[#DF00FF] via-[#A855F7] to-[#C084FC] tracking-tight drop-shadow-[0_0_35px_rgba(168,85,247,0.4)]">
                How do you know why?
              </h2>
            </motion.div>
          )}

          {/* ACT 4: WHAT ENGINEERS HAVE TODAY */}
          {act === 4 && (
            <motion.div
              key="act4"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ willChange: 'transform, opacity' }}
              className="space-y-10 w-full max-w-5xl mx-auto"
            >
              <h2 className="text-4xl md:text-6xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-300 tracking-tight">
                How do you know why?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {existingTools.map((tool, idx) => {
                  const isDimmed = idx < act4DimCount;
                  return (
                    <motion.div
                      key={tool.title}
                      animate={{
                        opacity: isDimmed ? 0.45 : 1,
                        scale: isDimmed ? 0.96 : 1,
                      }}
                      transition={appleSpring}
                      style={{ willChange: 'transform, opacity' }}
                      className={`p-7 rounded-2xl border text-center transition-all flex flex-col justify-between items-center space-y-4 ${
                        isDimmed
                          ? 'bg-[#0E0E12] border-zinc-800 text-zinc-400 backdrop-blur-md shadow-xl'
                          : 'bg-[#14141A] border-white/15 text-white shadow-2xl backdrop-blur-xl'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="w-11 h-11 rounded-xl bg-[#070709] border border-white/10 flex items-center justify-center mx-auto shadow-inner">
                          {tool.icon}
                        </div>
                        <div className="text-xl font-bold font-sans tracking-tight text-white">{tool.title}</div>
                      </div>

                      {isDimmed && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                          className="w-full text-xs font-mono font-bold text-red-300 px-3 py-2 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center justify-center space-x-1.5 shadow-lg shadow-red-500/10"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span>"{tool.label}"</span>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <p className="text-xs md:text-sm font-sans text-zinc-400 max-w-xl mx-auto font-medium">
                Traditional APM tools were built for microservices — not AI execution reasoning.
              </p>
            </motion.div>
          )}

          {/* ACT 5: THE OFFICIAL VOID REVEAL WITH GEOMETRIC LOGO */}
          {act === 5 && (
            <motion.div
              key="act5"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ willChange: 'transform, opacity' }}
              className="space-y-8 max-w-3xl mx-auto w-full"
            >
              {/* Official Geometric VOID Emblem */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={appleSpring}
                className="mx-auto mb-2 flex items-center justify-center"
              >
                <VoidLogo size={96} glow={true} />
              </motion.div>

              <h1 className="text-6xl md:text-8xl font-black font-sans text-white tracking-tight drop-shadow-2xl">VOID</h1>

              <div className="space-y-3 text-lg md:text-2xl font-sans text-zinc-300">
                <p className="font-semibold text-white">Instrument AI applications once.</p>
                <p>Capture every execution with OpenTelemetry.</p>
                <p className="text-[#A855F7] font-extrabold">Turn telemetry into incident intelligence.</p>
              </div>

              <button
                onClick={onComplete}
                className="mt-8 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#DF00FF] via-[#A855F7] to-[#7E22CE] hover:opacity-95 text-white font-sans font-bold text-sm transition-all shadow-[0_0_40px_rgba(168,85,247,0.4)] inline-flex items-center space-x-2.5 btn-tactile"
              >
                <span>Watch VOID diagnose a failure</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="flex items-center justify-between z-10 pt-6 border-t border-white/10 max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((a) => (
            <button
              key={a}
              onClick={() => setAct(a as any)}
              aria-label={`Act ${a}`}
              aria-current={act === a ? 'step' : undefined}
              className={`h-2 rounded-full transition-all duration-300 ${
                act === a ? 'w-8 bg-[#A855F7]' : 'w-2 bg-zinc-800 hover:bg-zinc-700'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono text-zinc-400">
          <span className="hidden sm:inline">Left/Right Keys</span>
          {act < 5 ? (
            <button
              onClick={() => setAct((prev) => (prev + 1) as any)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#0E0E12] border border-white/10 hover:text-white font-mono transition-all text-xs btn-tactile"
            >
              <span>NEXT_ACT</span>
              <ChevronRight className="w-4 h-4 text-[#A855F7]" />
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-[#A855F7] text-white font-bold text-xs shadow-lg shadow-[#A855F7]/30 btn-tactile"
            >
              <span>EXPLORE_DEMO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
