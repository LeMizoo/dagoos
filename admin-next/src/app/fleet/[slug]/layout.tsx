import { Metadata } from 'next';

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
