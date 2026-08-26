import { AuthProvider } from '@/lib/auth-context';
import { OrganizationProvider } from '@/lib/organization-context';
import FlotteLayout from '@/components/layout/FlotteLayout';
import PortalGuard from '@/components/auth/PortalGuard';

export const metadata = {
  title: 'Dagoo\'s Flotte',
};

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <PortalGuard allowedRoles={['FLEET_MANAGER', 'COOP_MANAGER']}>
          <FlotteLayout>{children}</FlotteLayout>
        </PortalGuard>
      </OrganizationProvider>
    </AuthProvider>
  );
}
