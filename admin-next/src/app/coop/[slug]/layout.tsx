import { Metadata } from 'next';

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
