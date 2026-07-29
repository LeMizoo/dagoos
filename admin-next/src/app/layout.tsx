import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dagoo - La mobilité connectée',
  description: "Plateforme de gestion de flotte et coopérative Dagoo",
  icons: { icon: '/favicon.svg' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
