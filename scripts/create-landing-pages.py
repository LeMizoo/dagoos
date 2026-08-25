#!/usr/bin/env python3
import os
import json

# Structure des fichiers à créer
files = {
    'admin-next/src/app/fleet/[slug]/page.tsx': """import { notFound } from 'next/navigation';

interface FleetPageProps {
  params: {
    slug: string;
  };
}

async function getFleetData(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizations/fleet/${slug}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch fleet data');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching fleet:', error);
    return null;
  }
}

export default async function FleetLandingPage({ params }: FleetPageProps) {
  const fleet = await getFleetData(params.slug);
  
  if (!fleet) {
    notFound();
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900">{fleet.name}</h1>
        <p className="text-xl text-gray-600 mt-4">{fleet.description || 'Fleet landing page'}</p>
        <div className="mt-8">
          <a href="/fleet-login" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Accéder à l'espace Fleet
          </a>
        </div>
      </div>
    </main>
  );
}
""",
    
    'admin-next/src/app/fleet/[slug]/layout.tsx': """import { Metadata } from 'next';

interface FleetLayoutProps {
  children: React.ReactNode;
  params: {
    slug: string;
  };
}

async function getFleetData(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizations/fleet/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: FleetLayoutProps): Promise<Metadata> {
  const fleet = await getFleetData(params.slug);
  
  if (!fleet) {
    return { title: 'Flotte non trouvée' };
  }
  
  return {
    title: `${fleet.name} - Dagoo Mobility`,
    description: fleet.description || `Découvrez la flotte ${fleet.name} sur Dagoo Mobility`,
  };
}

export default function FleetLayout({ children }: FleetLayoutProps) {
  return <>{children}</>;
}
""",
    
    'admin-next/src/app/coop/[slug]/page.tsx': """import { notFound } from 'next/navigation';

interface CoopPageProps {
  params: {
    slug: string;
  };
}

async function getCoopData(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizations/coop/${slug}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch coop data');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching coop:', error);
    return null;
  }
}

export default async function CoopLandingPage({ params }: CoopPageProps) {
  const coop = await getCoopData(params.slug);
  
  if (!coop) {
    notFound();
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900">{coop.name}</h1>
        <p className="text-xl text-gray-600 mt-4">{coop.description || 'Coopérative landing page'}</p>
        <div className="mt-8">
          <a href="/coop-login" className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Accéder à l'espace Coop
          </a>
        </div>
      </div>
    </main>
  );
}
""",
    
    'admin-next/src/app/coop/[slug]/layout.tsx': """import { Metadata } from 'next';

interface CoopLayoutProps {
  children: React.ReactNode;
  params: {
    slug: string;
  };
}

async function getCoopData(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizations/coop/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: CoopLayoutProps): Promise<Metadata> {
  const coop = await getCoopData(params.slug);
  
  if (!coop) {
    return { title: 'Coopérative non trouvée' };
  }
  
  return {
    title: `${coop.name} - Dagoo Mobility`,
    description: coop.description || `Découvrez la coopérative ${coop.name} sur Dagoo Mobility`,
  };
}

export default function CoopLayout({ children }: CoopLayoutProps) {
  return <>{children}</>;
}
""",
}

# Créer les dossiers et fichiers
for filepath, content in files.items():
    # Créer le dossier parent
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    # Écrire le fichier
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Créé: {filepath}")

print("\n🎉 Tous les fichiers ont été créés avec succès!")
print("\n📝 Prochaines étapes:")
print("1. Vérifier les slugs existants dans la base de données")
print("2. Tester localement: cd admin-next && npm run dev")
print("3. Visiter http://localhost:5001/fleet/[slug]")
print("4. Visiter http://localhost:5001/coop/[slug]")
