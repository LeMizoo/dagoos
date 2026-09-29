import { useEffect, useState } from 'react';
import App from '../App';
import {
  applyServiceWorkerUpdate,
  registerServiceWorker,
} from '../services/serviceWorker';
import { PwaUpdateBanner } from './PwaUpdateBanner';

export function PwaRoot() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    let active = true;

    void registerServiceWorker({
      onUpdateAvailable: () => {
        if (active) {
          setUpdateAvailable(true);
        }
      },
    }).then((result) => {
      if (active) {
        setRegistration(result);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handleUpdate = () => {
    if (!registration) {
      window.location.reload();
      return;
    }

    void applyServiceWorkerUpdate(registration);
  };

  return (
    <>
      <App />

      <PwaUpdateBanner
        visible={updateAvailable}
        onUpdate={handleUpdate}
        onLater={() => setUpdateAvailable(false)}
      />
    </>
  );
}
