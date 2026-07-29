import AppSidebar from '@/components/layout/AppSidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dagoo Coop - Gestion de coopérative' };

export default function CoopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar app="coop" />
      <main className="flex-1 ml-60 p-6 bg-gray-50">{children}</main>
    </div>
  );
}
