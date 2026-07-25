import { ExecutionTrace } from '../types';

const SERVER_URL = process.env.VOID_SERVER_URL || 'http://localhost:3001';

const TOOL_NAME_RE = /^Execute\s+(\w+(?:\.\w+)*)\s*\(/;

export function buildTraceSummary(trace: ExecutionTrace) {
  const isActualCrash =
    trace.outputTokens === 0 ||
    !!trace.error ||
    trace.steps.some((s) => s.kind === 'FAILED' && !s.label.includes('Loop'));

  const relevantSteps = trace.steps.filter(
    (s) => s.kind === 'TOOL_EXECUTION' || s.kind === 'FAILED',
  );

  return {
    execution_id: trace.id,
    trace_id: trace.traceId,
    steps: relevantSteps.map((s) => {
      const m = s.kind === 'TOOL_EXECUTION' ? s.label.match(TOOL_NAME_RE) : null;
      return {
        tool_name: m ? m[1] : s.label,
        success: s.status === 'ok',
        latency_ms: s.durationMs,
        error:
          s.status === 'error'
            ? (s.details?.error as string) || JSON.stringify(s.details)
            : undefined,
        input: s.kind === 'TOOL_EXECUTION' ? s.label : undefined,
      };
    }),
    total_latency_ms: trace.latencyMs,
    total_prompt_tokens: trace.inputTokens,
    total_completion_tokens: trace.outputTokens,
    retry_count: 0,
    crashed: isActualCrash,
    context_window_exceeded: trace.contextWindowExceeded ?? false,
  };
}

export async function submitTraceToVoidServer(trace: ExecutionTrace) {
  const summary = buildTraceSummary(trace);
  const res = await fetch(`${SERVER_URL}/api/traces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(summary),
  });

  if (!res.ok) {
    throw new Error(`VOID Server returned status ${res.status}`);
  }

  return res.json();
}
