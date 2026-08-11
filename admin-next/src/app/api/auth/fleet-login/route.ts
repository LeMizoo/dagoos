import { NextRequest } from 'next/server';
import { login } from '../../../../../../app/api/auth/_login';
export async function POST(request: NextRequest) { return login(request, 'fleet-login'); }
