'use client';

import React from 'react';
import { Activity, Play, Presentation, ExternalLink, RotateCcw, ShieldCheck } from 'lucide-react';
import { VoidLogo } from '@/components/VoidLogo';

interface HeroProps {
  onRunAll: () => void;
  onOpenWalkthrough: () => void;
  onReplayIntro?: () => void;
  isExecuting: boolean;
  activeCount: number;
}

export const Hero: React.FC<HeroProps> = ({
  onRunAll,
  onOpenWalkthrough,
  onReplayIntro,
  isExecuting,
  activeCount,
}) => {
  return (
    <header className="relative border-b border-white/10 bg-[#070709] py-10 md:py-14">
      {/* Radial Logo Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-radial-gradient from-[#A855F7]/12 via-purple-900/05 to-transparent blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        {/* Brand & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <VoidLogo size={36} glow={true} />
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="font-sans font-extrabold text-xl text-white tracking-tight">VOID SDK</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#0E0E12] text-zinc-300 border border-white/10">
                  v0.1.0
                </span>
                <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>SigNoz OTLP Ready</span>
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                NovaFlow SaaS Copilot | OpenTelemetry AI Incident Intelligence
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center space-x-2.5">
            {onReplayIntro && (
              <button
                onClick={onReplayIntro}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#0E0E12] text-xs font-mono text-zinc-300 border border-white/10 hover:text-white hover:border-[#A855F7]/40 transition-all btn-tactile"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                <span>Replay Story</span>
              </button>
            )}

            <button
              onClick={onOpenWalkthrough}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0E0E12] text-xs font-mono text-zinc-300 border border-white/10 hover:text-white transition-all btn-tactile"
            >
              <Presentation className="w-3.5 h-3.5 text-[#C084FC]" />
              <span>90s Keynote Pitch</span>
            </button>

            <a
              href="http://localhost:8080"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#0E0E12] text-xs font-mono text-zinc-400 border border-white/10 hover:text-white transition-all btn-tactile"
            >
              <Activity className="w-3.5 h-3.5 text-zinc-400" />
              <span>SigNoz Dashboard</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

            <button
              onClick={onRunAll}
              disabled={isExecuting}
              className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-sans font-semibold text-white transition-all shadow-lg btn-tactile ${
                isExecuting
                  ? 'bg-zinc-800 cursor-not-allowed text-zinc-500'
                  : 'bg-gradient-to-r from-[#DF00FF] via-[#A855F7] to-[#7E22CE] shadow-[#A855F7]/25'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
              <span>{isExecuting ? `Running (${activeCount}/10)...` : 'Run All 10 Traces'}</span>
            </button>
          </div>
        </div>

        {/* Hero Headline */}
        <div className="pt-2 max-w-4xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0E0E12] border border-[#A855F7]/40 text-xs font-mono text-[#C084FC]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>THE OPERATING SYSTEM FOR AI INCIDENTS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-sans text-white tracking-tight leading-[1.08]">
            Instrument AI applications once. Turn raw spans into incident intelligence.
          </h1>

          <p className="text-sm sm:text-base font-sans text-zinc-400 max-w-2xl leading-relaxed">
            AI agents introduce entirely new failure modes. VOID captures reasoning, tool calls, loops, and token burn in standard OpenTelemetry traces — without changing upstream application code.
          </p>
        </div>
      </div>
    </header>
  );
};
