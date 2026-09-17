import type { ReactNode } from 'react';
import LandingFooter from './LandingFooter';
import LandingHeader from './LandingHeader';

interface LandingLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export default function LandingLayout({
  children,
  showHeader = true,
}: LandingLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {showHeader && <LandingHeader />}
      {children}
      <LandingFooter />
    </div>
  );
}
