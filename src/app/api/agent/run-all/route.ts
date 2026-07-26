import { NextResponse } from 'next/server';
import { runFakeExecution } from '@/lib/fake-agent';
import { voidSdk } from '@void-hq/sdk';

const SERVER_URL = process.env.VOID_SERVER_URL || 'http://localhost:3001';

async function runWithCapture(index: number): Promise<{ incident_id?: string; status: string } | null> {
  let resolved: { incident_id?: string; status: string } | null = null;

  const cb = async (summary: unknown) => {
    const res = await fetch(`${SERVER_URL}/api/traces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary),
    });
    if (res.ok) {
      resolved = await res.json() as { incident_id?: string; status: string };
    }
  };
  voidSdk.setSubmitFn(cb);

  try {
    await runFakeExecution(index);
  } finally {
    voidSdk.setSubmitFn(null);
  }

  return resolved as { incident_id?: string; status: string } | null;
}

export async function POST() {
  try {
    const indices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const results: { index: number; incidentId: string | null }[] = [];

    for (const idx of indices) {
      const backendResult = await runWithCapture(idx);
      results.push({
        index: idx,
        incidentId: backendResult && backendResult.status !== 'healthy' ? (backendResult.incident_id ?? null) : null,
      });
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
