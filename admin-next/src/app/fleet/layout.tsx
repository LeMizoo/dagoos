import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import PortalGuard from '@/components/auth/PortalGuard';

export const metadata = {
  title: 'Dagoo Fleet',
};

export default function FleetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalGuard allowedRoles={['FLEET_MANAGER']}>
      <ResponsiveLayout app="fleet">
        {children}
      </ResponsiveLayout>
    </PortalGuard>
  );
}
