import { NextResponse } from 'next/server';
import { runFakeExecution } from '@/lib/fake-agent';

const SERVER_URL = process.env.VOID_SERVER_URL || 'http://localhost:3001';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Trace execution endpoint is available. Use POST /api/traces or POST /api/agent/run to execute AI agent runs.',
  });
}

export async function POST() {
  try {
    const results = [];
    for (let i = 1; i <= 10; i++) {
      const trace = await runFakeExecution(i);
      const summary = {
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

      const res = await fetch(`${SERVER_URL}/api/traces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summary),
      });
      const data = await res.json().catch(() => ({}));
      results.push({ trace, incidentId: data.incident_id ?? null, status: data.status });
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
