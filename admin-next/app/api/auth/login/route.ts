import { NextRequest } from 'next/server';
import { login } from '../_login';

export async function POST(req: NextRequest) {
  return login(req, 'login');
}
