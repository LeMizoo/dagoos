import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Dagoo's - La mobilité connectée",
  description: "Plateforme de gestion de flotte et coopérative de transport",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark:bg-gray-950">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
