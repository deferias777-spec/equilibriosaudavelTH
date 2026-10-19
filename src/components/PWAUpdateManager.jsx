import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { registerSW } from 'virtual:pwa-register';
import './PWAUpdateManager.css';

export default function PWAUpdateManager() {
  const [installed, setInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  const registrationRef = useRef(null);
  const updateFunctionRef = useRef(null);
  const checkingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    setInstalled(standalone);

    let disposed = false;
    let registration = null;
    let checkInterval = null;

    const updateSW = registerSW({
      immediate: true,

      onNeedRefresh() {
        if (!disposed) {
          setUpdateAvailable(true);
          setChecking(false);
          checkingRef.current = false;
        }
      },

      onRegisteredSW(swUrl, swRegistration) {
        registration = swRegistration || null;
        registrationRef.current = registration;

        if (!registration) return;

        const check = () => {
          if (disposed || !navigator.onLine) return;

          registration.update().catch(() => {
            // Falhas de rede nao interrompem o aplicativo.
          });
        };

        check();

        // Verificacao periodica enquanto o app estiver aberto.
        checkInterval = window.setInterval(check, 60 * 60 * 1000);
      },

      onRegisterError(error) {
        console.error('PWA: erro no registro', error);
      }
    });

    updateFunctionRef.current = updateSW;

    const checkOnReturn = () => {
      if (document.visibilityState !== 'visible') return;
      if (!navigator.onLine) return;

      registrationRef.current?.update().catch(() => {});
    };

    const checkOnFocus = () => {
      if (!navigator.onLine) return;

      registrationRef.current?.update().catch(() => {});
    };

    document.addEventListener('visibilitychange', checkOnReturn);
    window.addEventListener('focus', checkOnFocus);

    return () => {
      disposed = true;
      mountedRef.current = false;

      document.removeEventListener('visibilitychange', checkOnReturn);
      window.removeEventListener('focus', checkOnFocus);

      if (checkInterval) {
        window.clearInterval(checkInterval);
      }
    };
  }, []);

  const checkForUpdates = async () => {
    if (checkingRef.current) return;

    if (!navigator.onLine) {
      setMessage('Conecte-se à internet para verificar atualizações.');
      return;
    }

    checkingRef.current = true;
    setChecking(true);
    setMessage('');

    try {
      const registration =
        registrationRef.current ||
        (await navigator.serviceWorker?.getRegistration());

      if (!registration) {
        setMessage('Service Worker ainda não está disponível. Reabra o aplicativo.');
        return;
      }

      await registration.update();

      if (registration.waiting) {
        setUpdateAvailable(true);
      } else {
        setMessage(
          'Verificação concluída. Se houver uma nova versão, o aviso aparecerá quando estiver pronta.'
        );
      }
    } catch (error) {
      setMessage('Não foi possível verificar agora. Tente novamente.');
    } finally {
      checkingRef.current = false;

      if (mountedRef.current) {
        setChecking(false);
      }
    }
  };

  const applyUpdate = async () => {
    if (!updateFunctionRef.current) {
      setMessage('Atualização ainda não disponível.');
      return;
    }

    setChecking(true);

    try {
      await updateFunctionRef.current(true);
    } catch (error) {
      setChecking(false);
      setMessage('Não foi possível atualizar. Tente novamente.');
    }
  };

  if (!installed && !updateAvailable) {
    return null;
  }

  return createPortal(
    <div className="es-pwa-controls">
      {updateAvailable ? (
        <div className="es-pwa-update-banner" role="status">
          <img src="/images/favicon.png" alt="" />

          <div className="es-pwa-update-text">
            <strong>Nova versão disponível</strong>
            <span>Atualize para receber as melhorias.</span>
          </div>

          <button
            type="button"
            onClick={applyUpdate}
            disabled={checking}
          >
            {checking ? 'Atualizando...' : 'Atualizar agora'}
          </button>
        </div>
      ) : (
        <div className="es-pwa-update-check">
          <button
            type="button"
            onClick={checkForUpdates}
            disabled={checking}
            aria-label="Verificar atualizações do aplicativo"
          >
            <img src="/images/favicon.png" alt="" />
            {checking ? 'Verificando...' : 'Verificar atualização'}
          </button>

          {message && (
            <div className="es-pwa-update-message" role="status">
              <span>{message}</span>
              <button
                type="button"
                aria-label="Fechar mensagem"
                onClick={() => setMessage('')}
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}