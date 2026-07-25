import { NextResponse } from 'next/server';

const SERVER_URL = process.env.VOID_SERVER_URL || 'http://localhost:3001';

export async function POST() {
  try {
    const res = await fetch(`${SERVER_URL}/api/admin/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
