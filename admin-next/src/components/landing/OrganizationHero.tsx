'use client';

interface OrganizationHeroProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    description?: string;
    type: 'FLEET' | 'COOP';
    plan: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  };
  type: 'fleet' | 'coop';
}

export function OrganizationHero({ organization, type }: OrganizationHeroProps) {
  const colors = {
    fleet: {
      gradient: 'from-blue-600 to-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
    coop: {
      gradient: 'from-green-600 to-green-800',
      button: 'bg-green-600 hover:bg-green-700',
    },
  };

  const color = colors[type];

  return (
    <div className={`bg-gradient-to-r ${color.gradient} text-white py-16`}>
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold">{organization.name}</h1>
        <p className="text-xl text-white/90 mt-4">{organization.description}</p>
        <div className="mt-6">
          <a
            href={`/${type}-login`}
            className={`inline-block px-8 py-3 rounded-lg font-semibold ${color.button} text-white shadow-lg hover:shadow-xl transition-all`}
          >
            Accéder à l'espace {type === 'fleet' ? 'Fleet' : 'Coop'}
          </a>
        </div>
      </div>
    </div>
  );
}
