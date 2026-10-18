'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { firstTouch, type Attribution } from '@/lib/attribution';
import type { Interest } from '@/lib/content';

interface Selection { interest: Interest; product?: string }
interface OrderContextValue {
  selection: Selection;
  choose: (selection: Selection) => void;
  clearProduct: () => void;
  attribution: React.RefObject<Attribution | null>;
  pending: boolean;
  setPending: (pending: boolean) => void;
}
const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Selection>({ interest: 'subscription' });
  const attribution = useRef<Attribution | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    try {
      attribution.current = firstTouch(sessionStorage, location.href, document.referrer);
    } catch {
      attribution.current = firstTouch({ getItem: () => null, setItem: () => undefined }, location.href, document.referrer);
    }
  }, []);

  return <OrderContext.Provider value={{
    selection, choose: setSelection,
    clearProduct: () => setSelection(previous => ({ ...previous, product: undefined })), attribution, pending, setPending,
  }}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) throw new Error('Order controls must be inside OrderProvider');
  return context;
}

export function OrderLink({ interest, product, children, className, label }: {
  interest: Interest; product?: string; children: ReactNode; className?: string; label?: string;
}) {
  const { choose, pending } = useOrder();
  function select(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (pending) return;
    choose({ interest, product });
    history.replaceState(null, '', '#lead');
    document.getElementById('lead-form')?.focus({ preventScroll: true });
    document.getElementById('lead')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  return <a href="#lead" className={className} onClick={select} aria-label={label} aria-disabled={pending || undefined}>{children}</a>;
}
