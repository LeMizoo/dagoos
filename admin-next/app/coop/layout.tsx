import ResponsiveLayout from '@/components/layout/ResponsiveLayout';

export const metadata = { title: 'Dagoo Coop - Gestion de coopérative' };

export default function CoopLayout({ children }: { children: React.ReactNode }) {
  return <ResponsiveLayout app="coop">{children}</ResponsiveLayout>;
}
