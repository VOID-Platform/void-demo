import { NextResponse } from 'next/server';
import { runFakeExecution } from '@/lib/fake-agent';
import { voidSdk } from '@void-hq/sdk';

const SERVER_URL = process.env.VOID_SERVER_URL || 'http://localhost:3001';

async function runWithCapture(index: number): Promise<{ incident_id?: string; status: string; execution_id?: string; sampled?: boolean } | null> {
  let resolved: { incident_id?: string; status: string; execution_id?: string; sampled?: boolean } | null = null;

  const cb = async (summary: unknown) => {
    const res = await fetch(`${SERVER_URL}/api/traces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary),
    });
    if (res.ok) {
      const body = await res.json();
      resolved = {
        status: body.status,
        incident_id: body.incident_id,
        execution_id: body.execution_id,
        sampled: body.sampled === true,
      };
    }
  };
  voidSdk.setSubmitFn(cb);

  try {
    await runFakeExecution(index);
  } finally {
    voidSdk.setSubmitFn(null);
  }

  return resolved;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.index !== 'number' || body.index < 1 || body.index > 12) {
      return NextResponse.json({ success: false, error: 'index must be 1–12' }, { status: 400 });
    }

    const count = body.batch ?? 1;
    console.log(`[demo/api/agent/run] scenario index=${body.index} count=${count}`);

    // Flush stale sampling jobs so new sampled execution is processed immediately
    try {
      await fetch(`${SERVER_URL}/api/admin/reset/queue`, { method: 'POST' });
      console.log('[demo/api/agent/run] queue flushed');
    } catch {
      console.log('[demo/api/agent/run] queue flush skipped');
    }

    for (let i = 0; i < count; i++) {
      console.log(`[demo/api/agent/run] iteration ${i + 1}/${count}`);
      const backendResult = await runWithCapture(body.index);
      if (!backendResult) continue;

      if (backendResult.sampled) {
        console.log(`[demo/api/agent/run] SAMPLED iteration ${i + 1}: executionId=${backendResult.execution_id}`);
        return NextResponse.json({
          success: true,
          incidentId: null,
          sampled: true,
          executionId: backendResult.execution_id,
        });
      }

      if (backendResult.incident_id) {
        return NextResponse.json({
          success: true,
          incidentId: backendResult.incident_id,
          sampled: false,
          executionId: backendResult.execution_id ?? null,
        });
      }

      // healthy + not sampled → try next iteration
    }

    // All iterations healthy + not sampled
    return NextResponse.json({
      success: true,
      incidentId: null,
      sampled: false,
      executionId: null,
    });
  } catch (error) {
    console.error('[demo/api/agent/run] Error:', error);
    return NextResponse.json(
      { success: false },
      { status: 500 },
    );
  }
}
