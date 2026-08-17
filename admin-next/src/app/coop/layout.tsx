import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import PortalGuard from '@/components/auth/PortalGuard';

export const metadata = {
  title: 'Dagoo Coop - Gestion de coopérative',
};

export default function CoopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalGuard allowedRoles={['COOPERATIVE']}>
      <ResponsiveLayout app="coop">
        {children}
      </ResponsiveLayout>
    </PortalGuard>
  );
}
