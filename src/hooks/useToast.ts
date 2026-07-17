import { useCallback } from 'react';
import { pushToast, type ToastType } from '@/components/ui/ToastHost';

interface Toast {
  type: ToastType;
  message: string;
}

/**
 * Hook for showing toast notifications. Backed by the module-level store in
 * ToastHost, so messages render (and are announced) wherever <ToastHost/> is
 * mounted — no context provider required.
 */
export function useToast() {
  const addToast = useCallback((toast: Toast) => {
    pushToast(toast.type, toast.message);
  }, []);

  return { addToast };
}
