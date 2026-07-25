import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Trace submission endpoint. Use POST /api/traces with a trace summary body.',
  });
}

export async function POST(req: Request) {
  // ponytail: passthrough to void-server; duplicate of run-all removed
  const SERVER_URL = process.env.VOID_SERVER_URL || 'http://localhost:3001';

  try {
    const body = await req.json();
    const res = await fetch(`${SERVER_URL}/api/traces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
