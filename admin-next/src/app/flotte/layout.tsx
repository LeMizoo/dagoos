import { AuthProvider } from '@/lib/auth-context';
import { OrganizationProvider } from '@/lib/organization-context';
import FlotteLayout from '@/components/layout/FlotteLayout';

export const metadata = {
  title: 'Dagoo\'s Flotte',
};

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <FlotteLayout>{children}</FlotteLayout>
      </OrganizationProvider>
    </AuthProvider>
  );
}
