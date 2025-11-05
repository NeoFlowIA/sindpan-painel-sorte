import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';

export function PWAUpdatePrompt() {
  const updateToastShown = useRef(false);

  useEffect(() => {
    // Importar dinamicamente para evitar erros em desenvolvimento
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      import('virtual:pwa-register/react').then(({ registerSW }) => {
        registerSW({
          immediate: true,
          onRegistered(r) {
            console.log('✅ Service Worker registrado:', r);
          },
          onRegisterError(error) {
            console.error('❌ Erro ao registrar Service Worker:', error);
          },
          onNeedRefresh() {
            if (!updateToastShown.current) {
              updateToastShown.current = true;
              toast.info('Nova versão disponível!', {
                description: 'Clique em "Atualizar" para carregar a nova versão.',
                action: {
                  label: 'Atualizar',
                  onClick: () => {
                    window.location.reload();
                  },
                },
                duration: Infinity, // Não fecha automaticamente
                icon: <RotateCcw className="h-4 w-4" />,
              });
            }
          },
          onOfflineReady() {
            toast.success('Aplicativo pronto para uso offline!', {
              duration: 3000,
            });
          },
        });
      }).catch((error) => {
        // Em desenvolvimento, o virtual module pode não existir
        if (import.meta.env.DEV) {
          console.log('PWA module não disponível em desenvolvimento');
        } else {
          console.error('Erro ao carregar PWA module:', error);
        }
      });
    }
  }, []);

  return null; // Componente não renderiza nada, apenas gerencia notificações
}

