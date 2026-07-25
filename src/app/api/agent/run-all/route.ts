import { NextResponse } from 'next/server';
import { runFakeExecution } from '@/lib/fake-agent';
import { buildTraceSummary } from '@/lib/analyzer';

const SERVER_URL = process.env.VOID_SERVER_URL || 'http://localhost:3001';

// ponytail: fire 20 concurrent requests (mix of all 12 scenarios) to fill
// the adaptive-sampling window (default size = 20) in a single batch

const BURST_PRIORITY = [3, 10, 1, 2, 4, 11]; // flagged/suspicious get extra copies

export async function POST() {
  try {
    const allTraces = await Promise.all(
      Array.from({ length: 12 }, (_, i) => runFakeExecution(i + 1)),
    );

    // build 20 entries: 1× each scenario + extras for priority ones
    const selections: typeof allTraces = [];
    for (const t of allTraces) {
      selections.push(t);
    }
    for (const idx of BURST_PRIORITY) {
      if (selections.length >= 20) break;
      selections.push(allTraces[idx - 1]);
    }
    // fill remaining with scenario 1
    while (selections.length < 20) {
      selections.push(allTraces[0]);
    }

    const requests = selections.map((trace, i) => {
      const summary = buildTraceSummary(trace);
      return fetch(`${SERVER_URL}/api/traces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...summary, execution_id: `${trace.id}_batch_${i}` }),
      })
        .then(r => r.json().catch(() => ({})))
        .then(data => ({ trace, response: data }));
    });

    const results = await Promise.all(requests);

    const traces = results.map(r => r.trace);
    const reports = results.map(r => {
      if (!r.response.incident_id) {
        return {
          incident: 'Normal Execution — No Quality Issues',
          severity: 'success' as const,
          confidence: 100,
          evidence: ['All spans completed with status OK'],
          timeline: [],
          recommendation: 'No action required.',
          analysisCategory: 'deterministic' as const,
          analysisSource: 'server_evaluated' as const,
          samplingInfo: r.response.sampled ? 'Sampled for deep analysis' : 'Healthy — not sampled',
          disclaimer: '',
        };
      }
      return {
        incident: `Incident: ${r.response.severity ?? 'detected'}`,
        severity: (r.response.severity === 'CRITICAL' ? 'critical' : 'warning') as 'critical' | 'warning',
        confidence: 90,
        evidence: ['Incident created — check investigation panel for full report'],
        timeline: [],
        recommendation: 'Run individual investigation for detailed analysis.',
        analysisCategory: 'deterministic' as const,
        analysisSource: 'server_evaluated' as const,
        samplingInfo: '',
        disclaimer: '',
      };
    });

    return NextResponse.json({ success: true, traces, reports });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
