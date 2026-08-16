import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import PortalGuard from '@/components/auth/PortalGuard';

export const metadata = {
  title: 'Dagoo Admin - Tableau de bord',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalGuard
      allowedRoles={['SUPER_ADMIN', 'ADMIN']}
    >
      <ResponsiveLayout app="admin">
        {children}
      </ResponsiveLayout>
    </PortalGuard>
  );
}
