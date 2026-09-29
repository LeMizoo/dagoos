export interface ServiceWorkerUpdateHandlers {
  onUpdateAvailable: () => void;
}

function getWaitingWorker(
  registration: ServiceWorkerRegistration
): ServiceWorker | null {
  return registration.waiting;
}

export async function registerServiceWorker(
  handlers: ServiceWorkerUpdateHandlers
): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');

    const notifyIfWaiting = () => {
      const waitingWorker = getWaitingWorker(registration);

      if (waitingWorker) {
        handlers.onUpdateAvailable();
      }
    };

    notifyIfWaiting();

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (
          newWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          handlers.onUpdateAvailable();
        }
      });
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'UPDATE_AVAILABLE') {
        handlers.onUpdateAvailable();
      }

      if (event.data?.type === 'FORCE_RELOAD') {
        window.location.reload();
      }
    });

    return registration;
  } catch (error) {
    console.warn('[PWA] Enregistrement du Service Worker échoué', error);
    return null;
  }
}

export async function applyServiceWorkerUpdate(
  registration: ServiceWorkerRegistration
): Promise<void> {
  let reloaded = false;

  const reloadOnce = () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  };

  navigator.serviceWorker.addEventListener(
    'controllerchange',
    reloadOnce,
    { once: true }
  );

  try {
    const waitingWorker = getWaitingWorker(registration);

    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      return;
    }

    await registration.update();

    const updatedWaitingWorker = getWaitingWorker(registration);

    if (updatedWaitingWorker) {
      updatedWaitingWorker.postMessage({ type: 'SKIP_WAITING' });
      return;
    }

    reloadOnce();
  } catch {
    reloadOnce();
  }
}