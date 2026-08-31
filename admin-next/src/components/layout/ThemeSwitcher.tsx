'use client';

import { useTheme } from '@/lib/theme-context';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      <button
        onClick={() => setTheme('light')}
        className={`px-2 py-1 rounded-md text-sm transition ${theme === 'light' ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
        title="Clair"
      >
        ☀️
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`px-2 py-1 rounded-md text-sm transition ${theme === 'dark' ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
        title="Sombre"
      >
        🌙
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`px-2 py-1 rounded-md text-sm transition ${theme === 'system' ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
        title="Système"
      >
        🖥️
      </button>
    </div>
  );
}
