'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Loader2, Check, Sparkles, AlertTriangle, ExternalLink, GitPullRequest } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { InvestigationPipeline } from './InvestigationPipeline';
import type { PipelineState, PipelineEvent, InvestigationResponse } from '@/lib/types/investigation';
import { ANALYSIS_STATUS_LABEL, getStageErrorMessage } from '@/lib/types/investigation';
import { VoidLogo } from '@/components/VoidLogo';

interface InvestigationPageProps {
  variant?: 'full' | 'keynote';
  onBackToDeck?: () => void;
}

type Phase = 'idle' | 'running' | 'polling' | 'sampled' | 'healthy' | 'complete' | 'failed';

const SCENARIOS = [
  { index: 1, pill: 'Recursive API Loop', severity: 'critical' as const, summary: 'slack.sendMessage executed 5 consecutive times in 710ms' },
  { index: 3, pill: 'Silent Hallucination', severity: 'warning' as const, summary: 'Weather in Paris claimed as 25°C with ZERO tools invoked' },
  { index: 11, pill: 'Wrong Tool Action', severity: 'critical' as const, summary: 'User requested GitHub issue; agent executed slack.sendMessage' },
  { index: 2, pill: 'Execution Crash', severity: 'critical' as const, summary: 'Agent process crashed mid-stream during Stripe seat update' },
];

const SSE_BASE = process.env.NEXT_PUBLIC_VOID_SERVER_URL || 'http://localhost:3001';

export function InvestigationPage({ variant = 'full' }: InvestigationPageProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [pipelineState, setPipelineState] = useState<PipelineState>({});
  const [error, setError] = useState<string | null>(null);
  const [failedStage, setFailedStage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

  const scenario = SCENARIOS[activeIdx];
  const isBusy = phase === 'running' || phase === 'polling' || phase === 'sampled';

  // Fetch full investigation data when COMPLETED or FAILED
  const { data: investigationData, error: fetchError } = useQuery<InvestigationResponse>({
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
    if (!fetchError || phase !== 'complete') return;
    setError(fetchError instanceof Error ? fetchError.message : 'Fetch error');
  }, [fetchError, phase]);

  // SSE connection for real-time pipeline updates
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
      } catch { /* skip malformed events */ }
    });

    es.onerror = () => {
      // Fallback to polling
      es.close();
      if (phase === 'running') setPhase('polling');
    };
  }, [phase]);

  useEffect(() => {
    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (polledIncident?.id && phase === 'sampled') {
      setIncidentId(polledIncident.id);
      setPhase('running');
      connectSSE(polledIncident.id);
    }
  }, [polledIncident, phase, connectSSE]);

  const handleSelectScenario = useCallback((idx: number) => {
    if (isBusy) return;
    setActiveIdx(idx);
    setPhase('idle');
    setIncidentId(null);
    setExecutionId(null);
    setPipelineState({});
    setError(null);
    setFailedStage(null);
    if (sseRef.current) sseRef.current.close();
  }, [isBusy]);

  const handleRun = useCallback(async () => {
    if (isBusy) return;
    setError(null);
    setFailedStage(null);
    setPhase('running');
    setPipelineState({});
    setIncidentId(null);
    setExecutionId(null);

    // Reset SSE
    if (sseRef.current) sseRef.current.close();

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          index: scenario.index,
          batch: scenario.index === 3 || scenario.index === 11 ? 20 : undefined,
        }),
      });

      if (!res.ok) {
        setError(`Server returned ${res.status}.`);
        setPhase('failed');
        return;
      }

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
        setError(data.error ?? 'No incident was created.');
        setPhase('failed');
      }
    } catch (err) {
      setError(err instanceof TypeError ? 'Network error.' : 'Unexpected error.');
      setPhase('failed');
    }
  }, [isBusy, scenario, connectSSE]);

  const handleReset = useCallback(async () => {
    if (isResetting || isBusy) return;
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
  }, [isResetting, isBusy]);

  if (variant === 'keynote') {
    return (
      <div className="space-y-8">
        <InvestigationPipeline pipelineState={pipelineState} />

        {phase === 'complete' && (
          <CompletionCard
            issueUrl={investigationData?.issueUrl ?? null}
            signozTraceUrl={investigationData?.signozTraceUrl ?? null}
          />
        )}

        {phase === 'failed' && (
          <div className="flex flex-col items-center gap-4 py-14 text-center">
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
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-[#f4f4f5] flex flex-col font-sans selection:bg-violet-500/30 selection:text-white">
      {/* Ambient background */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[550px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-24 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-violet-400 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              <span>AI Application Incident Intelligence</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Investigation
            </h1>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            disabled={isResetting || isBusy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-500/10 via-violet-500/10 to-blue-500/10 hover:from-red-500/20 hover:via-violet-500/20 hover:to-blue-500/20 border border-white/10 hover:border-red-500/40 text-xs font-mono font-medium text-zinc-300 hover:text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
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
                <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                <span>Reset</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Scenario selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {SCENARIOS.map((s, idx) => (
            <button
              key={s.index}
              onClick={() => handleSelectScenario(idx)}
              disabled={isBusy}
              className={`p-4 rounded-2xl border text-left transition-all duration-300 ${
                activeIdx === idx
                  ? 'bg-violet-500/[0.08] border-violet-500/40 text-white ring-1 ring-violet-500/30'
                  : 'bg-white/[0.015] border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.12]'
              } ${isBusy ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold font-mono text-violet-400">{s.pill}</span>
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

        {/* Run button */}
        <div className="space-y-6 mb-8">
          <motion.button
            onClick={handleRun}
            disabled={isBusy}
            whileHover={{ scale: isBusy ? 1 : 1.01 }}
            whileTap={{ scale: isBusy ? 1 : 0.98 }}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-base font-semibold text-white transition-all duration-300 ${
              isBusy
                ? 'bg-white/[0.04] cursor-not-allowed text-zinc-500'
                : 'bg-violet-500 hover:bg-violet-600 shadow-lg shadow-violet-500/25'
            }`}
          >
            <span>
              {isBusy ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {phase === 'sampled'
                    ? 'Trace sampled — awaiting evaluation…'
                    : ANALYSIS_STATUS_LABEL[investigationData?.status ?? 'PENDING'] ?? 'Running investigation…'}
                </span>
              ) : (
                'Run Investigation'
              )}
            </span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              {isBusy ? (
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

        {/* Pipeline + Results */}
        <div className="space-y-8">
          {phase === 'running' && (
            <InvestigationPipeline pipelineState={pipelineState} />
          )}

          {phase === 'polling' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-16"
            >
              <div className="flex items-center gap-2.5">
                <VoidLogo size={22} glow={true} />
                <span className="text-sm font-mono text-violet-400">Running analysis…</span>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.18 }}
                    className="w-1.5 h-1.5 rounded-full bg-violet-500"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'sampled' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-16"
            >
              <div className="flex items-center gap-2.5">
                <VoidLogo size={22} glow={true} />
                <span className="text-sm font-mono text-amber-400">Trace sampled — evaluator running</span>
              </div>
              <p className="text-xs font-mono text-zinc-500 max-w-[36ch] text-center leading-relaxed">
                The trace was selected for adaptive sampling. Waiting for the evaluator to complete…
              </p>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.18 }}
                    className="w-1.5 h-1.5 rounded-full bg-amber-500"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 py-8 text-center"
            >
              <p className="text-sm font-mono text-red-400">{error}</p>
              <button onClick={() => setError(null)} className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors">
                Dismiss
              </button>
            </motion.div>
          )}

          {phase === 'healthy' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 py-14 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-emerald-300">No issues detected</p>
                <p className="text-xs font-mono text-zinc-500 max-w-[32ch] leading-relaxed">
                  The trace was evaluated as healthy. No investigation needed.
                </p>
              </div>
            </motion.div>
          )}

          {phase === 'complete' && (
            <CompletionCard
              issueUrl={investigationData?.issueUrl ?? null}
              signozTraceUrl={investigationData?.signozTraceUrl ?? null}
            />
          )}

          {phase === 'failed' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 py-12 text-center"
            >
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-400" />
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
        </div>
      </div>
    </div>
  );
}

export function CompletionCard({ issueUrl, signozTraceUrl }: { issueUrl: string | null; signozTraceUrl: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 py-10 text-center"
    >
      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
        <Check className="w-6 h-6 text-emerald-400" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-emerald-300">Investigation Complete</p>
        <p className="text-sm text-zinc-500 font-mono">The incident has been successfully investigated.</p>
      </div>
      <div className="flex gap-3">
        <a
          href={issueUrl ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            issueUrl
              ? 'bg-violet-500/10 text-violet-300 border border-violet-500/30 hover:bg-violet-500/20 hover:border-violet-500/50'
              : 'bg-zinc-800/30 text-zinc-600 border border-zinc-800 cursor-not-allowed'
          }`}
        >
          <GitPullRequest className="w-4 h-4" />
          Open GitHub Issue
        </a>
        <a
          href={signozTraceUrl ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            signozTraceUrl
              ? 'bg-violet-500/10 text-violet-300 border border-violet-500/30 hover:bg-violet-500/20 hover:border-violet-500/50'
              : 'bg-zinc-800/30 text-zinc-600 border border-zinc-800 cursor-not-allowed'
          }`}
        >
          <ExternalLink className="w-4 h-4" />
          View Trace in SigNoz
        </a>
      </div>
    </motion.div>
  );
}
