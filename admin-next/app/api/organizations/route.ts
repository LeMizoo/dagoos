import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const loginRes = await fetch('https://dagoos-api.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@dagoos.mg', password: 'admin123' }),
    });
    if (!loginRes.ok) throw new Error('Login failed');
    const { token } = await loginRes.json();

    const res = await fetch('https://dagoos-api.onrender.com/api/organizations', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const orgs = await res.json();
    return NextResponse.json(orgs);
  } catch {
    return NextResponse.json([]);
  }
}
