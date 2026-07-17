'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

type Listener = (toasts: ToastItem[]) => void;

// Module-level store so `useToast().addToast()` (called from anywhere in the
// tool) reaches the mounted <ToastHost/> without a React context provider.
let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();
const DISMISS_MS: Record<ToastType, number> = {
  success: 3000,
  info: 3000,
  warning: 5000,
  error: 6000,
};

function emit() {
  for (const l of listeners) l([...toasts]);
}

export function pushToast(type: ToastType, message: string): void {
  const id = nextId++;
  toasts = [...toasts, { id, type, message }].slice(-3); // cap at 3, oldest drops
  emit();
  const ttl = DISMISS_MS[type] ?? 4000;
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, ttl);
}

const BORDER: Record<ToastType, string> = {
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#e60023',
};

/**
 * Accessible toast region. Mount once inside the tool. Renders the shared
 * module store; announces via aria-live so screen readers hear errors.
 */
export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: Listener = (next) => setItems(next);
    listeners.add(listener);
    setItems([...toasts]);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        insetInlineEnd: '16px',
        insetBlockEnd: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 60,
        maxWidth: 'min(92vw, 380px)',
      }}
    >
      {items.map((t) => (
        <div
          key={t.id}
          style={{
            background: '#ffffff',
            color: '#262622',
            borderInlineStart: `4px solid ${BORDER[t.type]}`,
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '14px',
            lineHeight: 1.4,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
