import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import App from './App.tsx';
import { BrandingProvider } from './contexts/BrandingContext';
import { migrateLegacyStorage } from './services/storageMigration';

const migrationResult = migrateLegacyStorage();
if (import.meta.env.DEV && migrationResult.migrated.length > 0) {
  console.info(
    '[storageMigration] clés migrées :',
    migrationResult.migrated.join(', ')
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrandingProvider>
      <App />
    </BrandingProvider>
  </StrictMode>
);
