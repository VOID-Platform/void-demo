import { NextResponse } from 'next/server';
import { runFakeExecution } from '@/lib/fake-agent';
import { demoIncidentAnalyzer } from '@/lib/analyzer';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Trace execution endpoint is available. Use POST /api/traces or POST /api/agent/run-all to execute AI agent runs and emit telemetry.',
    data: [],
  });
}

export async function POST() {
  try {
    const results = [];
    for (let i = 1; i <= 10; i++) {
      const trace = await runFakeExecution(i);
      const report = await demoIncidentAnalyzer.analyze(trace);
      results.push({ trace, report });
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
