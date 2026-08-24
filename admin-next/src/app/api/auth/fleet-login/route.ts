import { NextRequest } from 'next/server';
import { POST as flotteLogin } from '../flotte-login/route';

export async function POST(request: NextRequest) {
  return flotteLogin(request);
}
