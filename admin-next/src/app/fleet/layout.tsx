import ResponsiveLayout from '@/components/layout/ResponsiveLayout';

export const metadata = { title: 'Dagoo Fleet - Gestion de flotte' };

export default function FleetLayout({ children }: { children: React.ReactNode }) {
  return <ResponsiveLayout app="fleet">{children}</ResponsiveLayout>;
}
