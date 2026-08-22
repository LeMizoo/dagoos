import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET manquant");
}

const secret = new TextEncoder().encode(jwtSecret);

export async function signToken(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch { return null; }
}

export async function getSession(
  space: 'admin' | 'org' = 'admin'
) {
  const cookieStore = cookies();

  const token =
    space === 'admin'
      ? cookieStore.get('dagoos_admin_token')?.value
      : cookieStore.get('dagoos_org_token')?.value;

  if (!token) return null;

  return verifyToken(token);
}
