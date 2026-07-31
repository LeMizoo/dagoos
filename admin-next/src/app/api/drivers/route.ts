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

    const res = await fetch('https://dagoos-api.onrender.com/api/drivers', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
