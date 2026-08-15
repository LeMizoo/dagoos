import ResponsiveLayout from '@/components/layout/ResponsiveLayout';

export const metadata = { title: 'Dagoo Admin - Tableau de bord' };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ResponsiveLayout app="admin">{children}</ResponsiveLayout>;
}
