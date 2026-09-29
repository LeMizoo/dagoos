// ============================================================
// App — Router + Layout principal
// Phase 1 — Étape 1.3 + 1.6.c
//
// Structure :
//   <BrandingProvider>        ← multi-tenant (dans main.tsx)
//     <BrowserRouter>
//       <App>                 ← ce fichier
//         <main id="app">
//           <Routes />
//         </main>
//         <BottomNav />
// ============================================================

import { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router';
import { BottomNav } from './components/BottomNav';
import { useLocalStorage } from './hooks/useLocalStorage';
import { HomePage } from './pages/Home';
import { CoursePage } from './pages/Course';
import { ReservationsPage } from './pages/Reservations';
import { LocationPage } from './pages/Location';

// ------------------------------------------------------------
// Persistance de la page courante (équivalent legacy
// localStorage.dagoos_mobile_page).
// ------------------------------------------------------------

const VALID_PATHS = [
  '/home',
  '/course',
  '/reservations',
  '/location',
] as const;

const DEFAULT_PATH = '/home';

function normalizeSavedPath(saved: string): string {
  return (VALID_PATHS as readonly string[]).includes(saved)
    ? saved
    : DEFAULT_PATH;
}

function PagePersistence() {
  const location = useLocation();
  const navigate = useNavigate();
  const [savedPage, setSavedPage] = useLocalStorage<string>(
    'page',
    DEFAULT_PATH
  );

  useEffect(() => {
    if (location.pathname === '/') {
      const target = normalizeSavedPath(savedPage);

      if (target !== '/') {
        navigate(target, { replace: true });
      }
    }
    // Lecture uniquement au boot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if ((VALID_PATHS as readonly string[]).includes(location.pathname)) {
      setSavedPage(location.pathname);
    }
  }, [location.pathname, setSavedPage]);

  return null;
}

// ------------------------------------------------------------
// Layout
// ------------------------------------------------------------

function Layout() {
  return (
    <>
      <main id="app">
        <Routes>
          <Route path="/" element={<Navigate to={DEFAULT_PATH} replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/course" element={<CoursePage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/location" element={<LocationPage />} />
          <Route path="*" element={<Navigate to={DEFAULT_PATH} replace />} />
        </Routes>
      </main>
      <BottomNav />
    </>
  );
}

// ------------------------------------------------------------
// App
// ------------------------------------------------------------

export default function App() {
  return (
    <BrowserRouter>
      <PagePersistence />
      <Layout />
    </BrowserRouter>
  );
}