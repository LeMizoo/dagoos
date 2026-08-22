import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import PortalGuard from '@/components/auth/PortalGuard';
import { AuthProvider } from '@/lib/auth-context';

export const metadata = {
  title: 'Dagoo Admin - Tableau de bord',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <PortalGuard
        allowedRoles={['SUPER_ADMIN', 'ADMIN']}
      >
      <ResponsiveLayout app="admin">
        {children}
      </ResponsiveLayout>
    </PortalGuard>
    </AuthProvider>
  );
}
