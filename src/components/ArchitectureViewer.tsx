'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, GitPullRequest, RefreshCw, Sparkles } from 'lucide-react';
import { VoidLogo } from '@/components/VoidLogo';

export const ArchitectureViewer: React.FC = () => {
  const [mode, setMode] = useState<'today' | 'future'>('today');

  return (
    <div className="space-y-4">
      {/* Beat Header */}
      <div className="border-b border-white/10 pb-3 flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-[#A855F7] uppercase tracking-wider font-bold">BEAT 5 OF 5</span>
          <h2 className="text-2xl font-sans font-extrabold text-white tracking-tight">Why is VOID different?</h2>
        </div>
        <span className="text-xs font-sans text-zinc-400">The Transformation Motion Story</span>
      </div>

      {/* Main Container */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#0E0E12] border border-white/10 space-y-6 shadow-2xl">
        {/* Header & Interactive Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <h3 className="text-xl font-sans font-extrabold text-white flex items-center gap-2.5">
              <VoidLogo size={24} glow={false} />
              <span>Instrument Once. Everything Downstream Evolves.</span>
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Your application code remains 100% untouched. Only the telemetry consumer evolves from analysis to autonomous repair.
            </p>
          </div>

          {/* Mode Selector Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#070709] border border-white/10">
            <button
              onClick={() => setMode('today')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all btn-tactile ${
                mode === 'today'
                  ? 'bg-[#14141A] text-white border border-[#A855F7]/50 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              TODAY (Demo Analyzer)
            </button>
            <button
              onClick={() => setMode('future')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all btn-tactile ${
                mode === 'future'
                  ? 'bg-[#14141A] text-white border border-emerald-500/50 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              TOMORROW (VOID Server)
            </button>
          </div>
        </div>

        {/* Pipeline Architecture Motion Story */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center text-center text-xs">
          {/* Step 1: Upstream Application */}
          <div className="p-4 rounded-xl bg-[#070709] border border-white/10 text-left space-y-1">
            <div className="text-[10px] uppercase font-mono text-zinc-500 font-bold">1. UPSTREAM_APP</div>
            <div className="font-sans font-bold text-white text-xs">NovaFlow SaaS</div>
            <div className="text-[11px] font-mono text-zinc-400">AI Copilot Code</div>
          </div>

          <div className="hidden md:flex justify-center text-zinc-600">
            <ArrowRight className="w-4 h-4 text-zinc-600" />
          </div>

          {/* Step 2: OpenTelemetry SDK */}
          <div className="p-4 rounded-xl bg-[#070709] border border-white/10 text-left space-y-1">
            <div className="text-[10px] uppercase font-mono text-zinc-500 font-bold">2. TELEMETRY_SDK</div>
            <div className="font-mono font-bold text-white text-xs">@void-hq/sdk</div>
            <div className="text-[11px] font-mono text-zinc-400">Standard OTLP Spans</div>
          </div>

          <div className="hidden md:flex justify-center text-zinc-600">
            <ArrowRight className="w-4 h-4 text-zinc-600" />
          </div>

          {/* Step 3: SigNoz OTLP Collector */}
          <div className="p-4 rounded-xl bg-[#070709] border border-white/10 text-left space-y-1">
            <div className="text-[10px] uppercase font-mono text-emerald-400 font-bold">3. OTLP_ENGINE</div>
            <div className="font-sans font-bold text-white text-xs">SigNoz Collector</div>
            <div className="text-[11px] font-mono text-zinc-400">http://localhost:4318</div>
          </div>

          <div className="hidden md:flex justify-center text-zinc-600">
            <ArrowRight className="w-4 h-4 text-zinc-600" />
          </div>

          {/* Step 4: TODAY vs TOMORROW Morphing Consumer Node */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`p-4 rounded-xl text-left border transition-all ${
                mode === 'today'
                  ? 'bg-[#14141A] border-[#A855F7] shadow-lg shadow-[#A855F7]/15'
                  : 'bg-[#0f1713] border-emerald-500 shadow-lg shadow-emerald-500/15'
              }`}
            >
              <div className="text-[10px] uppercase font-mono text-amber-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{mode === 'today' ? '4. DEMO_CONSUMER' : '4. VOID_SERVER'}</span>
              </div>
              <div className="font-sans font-bold text-white text-xs mt-1">
                {mode === 'today' ? 'DemoIncidentAnalyzer' : 'VOID Server Engine'}
              </div>
              <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                {mode === 'today' ? 'Deterministic Evaluator' : 'Autonomous Repair Agents'}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Transformation Pipeline Funnel Banner */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center space-x-2 text-zinc-300 font-sans">
            <span className="font-mono text-xs text-zinc-400 font-bold uppercase">Pipeline Flow:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#070709] border border-white/10 text-zinc-300 text-xs font-mono">
              10 traces ingested
            </span>
            <span className="text-zinc-600">→</span>
            <span className="px-3 py-0.5 rounded-full bg-[#14141A] text-zinc-200 border border-[#A855F7]/40 text-xs font-mono">
              Semantic Sampling (2 of 10 flagged)
            </span>
            <span className="text-zinc-600">→</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
              {mode === 'today' ? 'Demo Incident Report' : 'Automated Repair Actions'}
            </span>
          </div>

          {mode === 'future' && (
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400">
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>Target: GitHub Issue Formation & Linear Sync</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
