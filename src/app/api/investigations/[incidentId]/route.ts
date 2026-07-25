import { NextResponse } from 'next/server';

const SERVER_URL = process.env.VOID_SERVER_URL || 'http://localhost:3001';

export async function GET(_req: Request, { params }: { params: Promise<{ incidentId: string }> }) {
  const { incidentId } = await params;
  const res = await fetch(`${SERVER_URL}/api/investigations/${incidentId}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
