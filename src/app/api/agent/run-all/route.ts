import { NextResponse } from 'next/server';
import { runFakeExecution } from '@/lib/fake-agent';
import { demoIncidentAnalyzer } from '@/lib/analyzer';
import { ExecutionTrace, IncidentReport } from '@/lib/types';

export async function POST() {
  try {
    const traces: ExecutionTrace[] = [];
    const reports: IncidentReport[] = [];

    for (let i = 1; i <= 10; i++) {
      const trace = await runFakeExecution(i);
      const report = await demoIncidentAnalyzer.analyze(trace);
      traces.push(trace);
      reports.push(report);
    }

    return NextResponse.json({
      success: true,
      traces,
      reports,
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
