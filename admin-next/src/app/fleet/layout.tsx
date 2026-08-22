import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import PortalGuard from '@/components/auth/PortalGuard';
import { AuthProvider } from '@/lib/auth-context';

export const metadata = {
  title: 'Dagoo Fleet',
};

export default function FleetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <PortalGuard allowedRoles={['FLEET_MANAGER']}>
      <ResponsiveLayout app="fleet">
        {children}
      </ResponsiveLayout>
    </PortalGuard>
    </AuthProvider>
  );
}
