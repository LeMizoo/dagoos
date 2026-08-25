import { NextRequest } from 'next/server';
import { login } from '../_login';

export async function POST(request: NextRequest) {
  return login(request, 'interurbain-login');
}
