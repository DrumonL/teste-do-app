"use client";

import { useEffect, useState } from "react";
import { flushPending, getPendingCount } from "@/lib/saveWithRetry";

const POLL_INTERVAL_MS = 15000;
const INITIAL_DELAY_MS = 2000;

export default function PendingBanner() {
  const [pending, setPending] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let busyLocal = false;

    async function tick() {
      if (cancelled) return;

      const pendingCount = await getPendingCount();

      if (pendingCount > 0 && !busyLocal) {
        busyLocal = true;
        setBusy(true);
        await flushPending();
        busyLocal = false;
        if (!cancelled) setBusy(false);
      }

      if (!cancelled) {
        setPending(await getPendingCount());
        timer = setTimeout(tick, POLL_INTERVAL_MS);
      }
    }

    function onFocus() {
      if (timer) clearTimeout(timer);
      tick();
    }

    getPendingCount().then((count) => {
      if (!cancelled) setPending(count);
    });
    timer = setTimeout(tick, INITIAL_DELAY_MS);
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (pending === 0) return null;

  return (
    <div className="pending-banner" role="status" aria-live="polite">
      <span>
        {pending} {pending === 1 ? "envio pendente" : "envios pendentes"}.{" "}
        {busy ? "Reenviando..." : "Tentando reenviar automaticamente."}
      </span>
    </div>
  );
}
