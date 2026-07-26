import { NextResponse } from 'next/server';

const SERVER_URL = process.env.VOID_SERVER_URL || 'http://localhost:3001';

export async function GET(_req: Request, { params }: { params: Promise<{ executionId: string }> }) {
  const { executionId } = await params;
  const res = await fetch(`${SERVER_URL}/api/incidents/by-execution/${executionId}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
