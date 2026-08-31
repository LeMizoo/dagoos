import type { Metadata } from 'next';
import { Manrope, Inter } from 'next/font/google';
import { ThemeProvider } from '@/lib/theme-context';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Dagoo's - La mobilité connectée",
  description: "Plateforme de gestion de flotte et coopérative de transport",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`dark:bg-gray-950 ${manrope.variable} ${inter.variable}`}>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
