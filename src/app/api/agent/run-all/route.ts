import { NextResponse } from 'next/server';
import { runFakeExecution } from '@/lib/fake-agent';
import { demoIncidentAnalyzer } from '@/lib/analyzer';
import { ExecutionTrace, IncidentReport } from '@/lib/types';

export async function POST() {
  try {
    const traces: ExecutionTrace[] = [];
    const reports: IncidentReport[] = [];

    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 1; i <= 10; i++) {
      try {
        const trace = await runFakeExecution(i);
        const report = await demoIncidentAnalyzer.analyze(trace);
        traces.push(trace);
        reports.push(report);
      } catch (err) {
        errors.push({
          index: i,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const isSuccess = traces.length > 0;
    return NextResponse.json(
      {
        success: isSuccess,
        traces,
        reports,
        ...(errors.length > 0 ? { errors } : {}),
      },
      { status: isSuccess ? 200 : 500 }
    );
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
