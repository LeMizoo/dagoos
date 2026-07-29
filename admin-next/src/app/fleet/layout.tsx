import AppSidebar from '@/components/layout/AppSidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dagoo Fleet - Gestion de flotte' };

export default function FleetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar app="fleet" />
      <main className="flex-1 ml-60 p-6 bg-gray-50">{children}</main>
    </div>
  );
}
