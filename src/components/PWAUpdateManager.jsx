import React, { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import './PWAUpdateManager.css';

export default function PWAUpdateManager() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let registration = null;

    const updateSW = registerSW({
      immediate: true,

      onNeedRefresh() {
        if (!disposed) {
          setUpdateAvailable(true);
        }
      },

      onOfflineReady() {
        if (!disposed) {
          setOfflineReady(true);
        }
      },

      onRegisteredSW(swUrl, swRegistration) {
        registration = swRegistration;

        if (!registration) return;

        const checkForUpdates = () => {
          if (!navigator.onLine) return;

          registration.update().catch(() => {
            // Falhas temporarias de rede nao interrompem o app.
          });
        };

        const onVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            checkForUpdates();
          }
        };

        window.addEventListener('focus', checkForUpdates);
        document.addEventListener(
          'visibilitychange',
          onVisibilityChange
        );

        checkForUpdates();

        cleanupListeners = () => {
          window.removeEventListener('focus', checkForUpdates);
          document.removeEventListener(
            'visibilitychange',
            onVisibilityChange
          );
        };
      }
    });

    let cleanupListeners = () => {};

    updateHandler = updateSW;

    return () => {
      disposed = true;
      cleanupListeners();
    };
  }, []);

  const installUpdate = async () => {
    if (!updateHandler) return;

    setUpdateAvailable(false);

    try {
      await updateHandler(true);
    } catch {
      setUpdateAvailable(true);
    }
  };

  return (
    <>
      {updateAvailable && (
        <div
          className="es-pwa-update"
          role="status"
          aria-live="polite"
        >
          <div className="es-pwa-update__icon">
            <img
              src="/images/favicon.png"
              alt=""
            />
          </div>

          <div className="es-pwa-update__content">
            <strong>Uma nova versão está disponível</strong>
            <span>
              Atualize para aproveitar as melhorias
              do Equilíbrio Saudável.
            </span>
          </div>

          <button
            type="button"
            onClick={installUpdate}
          >
            Atualizar agora
          </button>
        </div>
      )}

      {offlineReady && !updateAvailable && (
        <div
          className="es-pwa-offline-ready"
          role="status"
        >
          O aplicativo está preparado para acesso básico offline.
          <button
            type="button"
            onClick={() => setOfflineReady(false)}
          >
            Fechar
          </button>
        </div>
      )}
    </>
  );
}

let updateHandler = null;