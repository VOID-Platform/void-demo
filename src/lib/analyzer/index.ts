import { ExecutionTrace } from '../types';

const SERVER_URL = process.env.VOID_SERVER_URL || 'http://localhost:3001';

export function buildTraceSummary(trace: ExecutionTrace) {
  const isActualCrash =
    trace.outputTokens === 0 ||
    !!trace.error ||
    trace.steps.some((s) => s.kind === 'FAILED' && !s.label.includes('Loop'));

  return {
    execution_id: trace.id,
    trace_id: trace.traceId,
    steps: trace.toolCalls.map((t) => ({ tool_name: t, success: true })),
    total_latency_ms: trace.latencyMs,
    total_prompt_tokens: trace.inputTokens,
    total_completion_tokens: trace.outputTokens,
    retry_count: 0,
    crashed: isActualCrash,
    context_window_exceeded: false,
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
