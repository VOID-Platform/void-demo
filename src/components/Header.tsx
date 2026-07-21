'use client';

import React from 'react';
import { Play, Loader2, Presentation } from 'lucide-react';
import { VoidLogo } from '@/components/VoidLogo';

interface HeaderProps {
  onRunAll: () => void;
  onOpenWalkthrough?: () => void;
  onReplayIntro?: () => void;
  isExecuting: boolean;
  activeCount: number;
}

const StatusDot: React.FC<{ color: 'green' | 'amber' | 'purple' | 'zinc'; pulse?: boolean }> = ({ color, pulse }) => {
  const colors = {
    green:  'bg-emerald-400',
    amber:  'bg-amber-400',
    purple: 'bg-[#A855F7]',
    zinc:   'bg-zinc-500',
  };
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors[color]} ${pulse ? 'animate-pulse' : ''}`} />
  );
};

interface ContextItemProps {
  label: string;
  dotColor?: 'green' | 'amber' | 'purple' | 'zinc';
  pulseDot?: boolean;
}

const ContextItem: React.FC<ContextItemProps> = ({ label, dotColor, pulseDot }) => (
  <div className="flex items-center gap-1.5">
    {dotColor && <StatusDot color={dotColor} pulse={pulseDot} />}
    <span className="text-[11px] font-sans text-zinc-400 tracking-tight">{label}</span>
  </div>
);

const Divider = () => (
  <span className="w-px h-3 bg-white/10 flex-shrink-0" />
);

export const Header: React.FC<HeaderProps> = ({
  onRunAll,
  onOpenWalkthrough,
  isExecuting,
  activeCount,
}) => {
  return (
    <header className="border-b border-white/[0.06] bg-[#030307]/[0.98] backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 h-14 flex items-center justify-between gap-6">

        {/* ── LEFT: Brand identity ── */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <VoidLogo size={24} glow={false} />

          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-bold font-sans text-white tracking-[-0.02em]">VOID</span>
          </div>

          {/* Vertical rule */}
          <span className="hidden lg:block w-px h-6 bg-white/[0.08] flex-shrink-0 mx-1" />

          {/* System context — hidden on screens smaller than large desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <ContextItem label="OTLP Telemetry Connected" dotColor="green" pulseDot />
            <Divider />
            <ContextItem label="10 Demo Traces" dotColor="purple" />
            <Divider />
            <ContextItem label="Incident Intelligence" dotColor="amber" />
            <Divider />
            <ContextItem label="Ready for Analysis" dotColor="zinc" />
          </div>
        </div>

        {/* ── RIGHT: Primary CTA & Optional Walkthrough ── */}
        <div className="flex items-center gap-3">
          {onOpenWalkthrough && (
            <button
              onClick={onOpenWalkthrough}
              title="Open Demo Walkthrough Pitch Guide"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-sans text-zinc-400 border border-white/[0.08] bg-[#09090D] hover:text-white hover:border-white/20 transition-all flex-shrink-0"
            >
              <Presentation className="w-3.5 h-3.5 text-[#C084FC]" />
              <span className="hidden sm:inline">Pitch Guide</span>
            </button>
          )}

          <button
            onClick={onRunAll}
            disabled={isExecuting}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold font-sans
              transition-all duration-200 flex-shrink-0
              ${isExecuting
                ? 'bg-zinc-800/80 text-zinc-500 cursor-not-allowed border border-white/[0.06]'
                : 'bg-white text-[#0A0A0F] hover:bg-zinc-100 shadow-sm shadow-black/30'
              }
            `}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                <span>
                  {activeCount > 0 ? `Analyzing ${activeCount} traces…` : 'Analyzing…'}
                </span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Begin Investigation</span>
              </>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
