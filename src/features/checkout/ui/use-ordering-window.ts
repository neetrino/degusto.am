"use client";

import { useEffect, useState } from "react";

import { isOrderingOpen } from "@/features/checkout/domain/ordering-hours";

const RECHECK_MS = 15_000;

/**
 * Tracks the Yerevan order window on the client so the checkout button
 * flips at the boundary without a refresh. Server still enforces.
 */
export function useOrderingWindow(initialOpen: boolean): boolean {
  const [isOpen, setIsOpen] = useState(initialOpen);

  useEffect(() => {
    function sync(): void {
      setIsOpen(isOrderingOpen(new Date()));
    }

    sync();
    const timer = window.setInterval(sync, RECHECK_MS);
    return () => window.clearInterval(timer);
  }, []);

  return isOpen;
}
