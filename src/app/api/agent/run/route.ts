import { NextResponse } from 'next/server';
import { runFakeExecution } from '@/lib/fake-agent';
import { buildTraceSummary } from '@/lib/analyzer';

const SERVER_URL = process.env.VOID_SERVER_URL || 'http://localhost:3001';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.index !== 'number' || body.index < 1 || body.index > 12) {
      return NextResponse.json({ success: false, error: 'index must be 1–12' }, { status: 400 });
    }

    console.log(`[demo/api/agent/run] 🚀 Executing scenario index=${body.index}`);
    const trace = await runFakeExecution(body.index);
    const summary = buildTraceSummary(trace);
    summary.execution_id = `${summary.execution_id}_${Date.now()}`;
    console.log(`[demo/api/agent/run] 📊 Trace generated: id=${trace.id} title="${trace.title}" tools=${trace.toolCalls.length}`);

    // ponytail: scenario 3 (hallucination) fires 20 concurrent traces to fill
    // the adaptive-sampling window; the risk engine says HEALTHY (0 tools ≠ policy),
    // but the sampler promotes 1 of 20 for semantic evaluation
    if (trace.flaggedForSemantic && trace.toolCalls.length === 0) {
      console.log(`[demo/api/agent/run] 🌀 Silent Hallucination trace detected — forwarding to incident pipeline...`);
      const semanticSummary = {
        ...summary,
        crashed: true, // triggers SUSPICIOUS/CRITICAL severity in risk-engine
        steps: [
          {
            tool_name: "weather.getForecast",
            success: false,
            latency_ms: 240,
            error: "Tool lookup skipped — agent emitted unverified weather claim 'The weather in Paris is 25°C' with zero API calls",
          },
        ],
      };

      const res = await fetch(`${SERVER_URL}/api/traces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(semanticSummary),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[demo/api/agent/run] 📥 Hallucination incident created: incidentId=${data.incident_id}`);
        return NextResponse.json({
          success: true,
          trace,
          incidentId: data.incident_id ?? null,
          isHealthy: false,
        });
      }
    }

    console.log(`[demo/api/agent/run] 📤 Forwarding trace summary to ${SERVER_URL}/api/traces`);
    const res = await fetch(`${SERVER_URL}/api/traces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary),
    });

    if (!res.ok) {
      console.error(`[demo/api/agent/run] ❌ Server returned error status ${res.status}`);
      return NextResponse.json({ success: false, error: `Server error ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    console.log(`[demo/api/agent/run] 📥 Server response received: status=${data.status} incidentId=${data.incident_id ?? 'none'}`);

    // ponytail: for flagged traces (wrong tool, etc.) that pass the risk engine
    // as healthy, return an inline report so the demo still shows a result
    if (trace.flaggedForSemantic && data.status === 'healthy') {
      return NextResponse.json({
        success: true,
        trace,
        report: {
          incident: `${trace.storyChapter.title}`,
          severity: 'warning' as const,
          confidence: 78,
          evidence: [
            `Prompt requested: "${trace.prompt}"`,
            `Executed tools: ${trace.toolCalls.join(', ') || 'none'}`,
            'Trace flagged for semantic evaluation — deterministic policies did not fire',
          ],
          timeline: [],
          recommendation: 'Review the trace and consider whether the executed tools match the user\'s intent.',
          analysisCategory: 'semantic' as const,
          analysisSource: 'local_heuristic' as const,
          samplingInfo: 'Flagged for semantic sampling',
          disclaimer: 'Deterministic engine: HEALTHY. Semantic evaluation recommended.',
        },
        incidentId: null,
        isHealthy: false,
      });
    }

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
