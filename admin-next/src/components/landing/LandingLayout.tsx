import type { ReactNode } from 'react';
import LandingFooter from './LandingFooter';

interface LandingLayoutProps {
  children: ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {children}
      <LandingFooter />
    </div>
  );
}
