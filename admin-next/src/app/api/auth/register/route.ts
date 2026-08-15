import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      password,
      role,
      organizationName,
      planId,
    } = body;

    if (
      !name ||
      !email ||
      !password ||
      !role ||
      !organizationName ||
      !planId
    ) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error:
            'Le mot de passe doit contenir au moins 6 caractères',
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/api/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email: email.trim().toLowerCase(),
          password,
          role,
          organizationName,
          planId,
        }),
        cache: 'no-store',
      }
    );

    const data = await response
      .json()
      .catch(() => ({
        error: 'Réponse invalide du serveur API',
      }));

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.error ||
            "Erreur lors de l'inscription",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('[auth/register]', error);

    return NextResponse.json(
      { error: 'Service serveur indisponible' },
      { status: 502 }
    );
  }
}
