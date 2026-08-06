import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dagoo - La mobilité connectée',
  description: "Plateforme de gestion de flotte et coopérative Dagoo",
  icons: { icon: '/favicon.svg' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('dagoos_theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (theme === 'system') {
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                  // Si theme === 'light', null, ou absent : pas de classe dark
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">{children}</body>
    </html>
  );
}
