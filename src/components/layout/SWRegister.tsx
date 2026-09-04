'use client';

import { useEffect } from 'react';

export function SWRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registrado con éxito:', registration.scope);
          })
          .catch((err) => {
            console.error('Error al registrar SW:', err);
          });
      });
    }
  }, []);

  return null;
}
