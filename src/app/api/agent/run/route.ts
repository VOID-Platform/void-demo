import { NextResponse } from 'next/server';
import { runFakeExecution } from '@/lib/fake-agent';

const SERVER_URL = process.env.VOID_SERVER_URL || 'http://localhost:3001';

// ponytail: healthy scenarios get no incidentId — risk engine says HEALTHY, nothing to poll
const HEALTHY_SCENARIOS = new Set([1, 2, 3, 4, 5, 7, 8, 10]);
// ponytail: burst fires fire-and-forget; adaptive sampling may promote one async in background
const BURST_SIZE = 20;

function buildTraceSummary(trace: Awaited<ReturnType<typeof runFakeExecution>>) {
  return {
    execution_id: trace.id,
    trace_id: trace.traceId,
    steps: trace.toolCalls.map((t) => ({ tool_name: t, success: true })),
    total_latency_ms: trace.latencyMs,
    total_prompt_tokens: trace.inputTokens,
    total_completion_tokens: trace.outputTokens,
    retry_count: 0,
    crashed: trace.outputTokens === 0 || !!trace.error,
    context_window_exceeded: false,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.index !== 'number' || body.index < 1 || body.index > 10) {
      return NextResponse.json({ success: false, error: 'index must be 1–10' }, { status: 400 });
    }

    const trace = await runFakeExecution(body.index);
    const summary = buildTraceSummary(trace);

    if (HEALTHY_SCENARIOS.has(body.index)) {
      // fire burst, don't wait
      for (let i = 0; i < BURST_SIZE; i++) {
        fetch(`${SERVER_URL}/api/traces`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...summary, execution_id: `${trace.id}_burst_${i}` }),
        }).catch(() => {});
      }
      return NextResponse.json({ success: true, trace, incidentId: null, isHealthy: true });
    }

    const res = await fetch(`${SERVER_URL}/api/traces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary),
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Server error ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      trace,
      incidentId: data.incident_id ?? null,
      isHealthy: data.status === 'healthy',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
