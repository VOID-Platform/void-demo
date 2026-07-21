import { NextResponse } from 'next/server';
import { runFakeExecution } from '@/lib/fake-agent';
import { demoIncidentAnalyzer } from '@/lib/analyzer';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.index !== 'number' || !Number.isInteger(body.index) || body.index < 1 || body.index > 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request payload. Scenario index must be an integer between 1 and 10.',
        },
        { status: 400 }
      );
    }

    const index = body.index;

    // 1. Run Fake Agent execution (instruments using VOID SDK)
    const trace = await runFakeExecution(index);

    // 2. Run Demo Incident Analyzer
    const report = await demoIncidentAnalyzer.analyze(trace);

    return NextResponse.json({
      success: true,
      trace,
      report,
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
