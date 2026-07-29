import AppSidebar from '@/components/layout/AppSidebar';

export default function FleetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar app="fleet" />
      <main className="flex-1 ml-60 p-6 bg-gray-50">{children}</main>
    </div>
  );
}
