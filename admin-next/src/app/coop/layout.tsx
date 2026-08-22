import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import PortalGuard from '@/components/auth/PortalGuard';
import { AuthProvider } from '@/lib/auth-context';

export const metadata = {
  title: 'Dagoo Coop - Gestion de coopérative',
};

export default function CoopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <PortalGuard allowedRoles={['COOP_MANAGER']}>
      <ResponsiveLayout app="coop">
        {children}
      </ResponsiveLayout>
    </PortalGuard>
    </AuthProvider>
  );
}
