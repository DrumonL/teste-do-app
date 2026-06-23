/*
  Client-side save with automatic retry and persistent queue.
  - Tries immediately a few times with backoff.
  - If all immediate attempts fail, queues the request in localStorage.
  - flushPending() drains the queue. Call it on app mount, on focus, and on a timer.
  - The queue is processed in FIFO order, so dependent saves stay in order.
*/

const PENDING_KEY = "pending-saves-v1";

type PendingSave = {
  id: string;
  url: string;
  body: unknown;
  createdAt: string;
  attempts: number;
};

function readQueue(): PendingSave[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: PendingSave[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_KEY, JSON.stringify(items));
}

function enqueue(url: string, body: unknown) {
  const items = readQueue();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  items.push({
    id,
    url,
    body,
    createdAt: new Date().toISOString(),
    attempts: 0,
  });

  writeQueue(items);
  return id;
}

function dequeue(id: string) {
  writeQueue(readQueue().filter((item) => item.id !== id));
}

function bumpAttempts(id: string) {
  const items = readQueue();
  const item = items.find((i) => i.id === id);

  if (item) {
    item.attempts += 1;
    writeQueue(items);
  }
}

async function tryFetch(url: string, body: unknown): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export type SaveWithRetryResult = {
  ok: boolean;
  queued: boolean;
};

export async function saveWithRetry(
  url: string,
  body: unknown,
  options: {
    immediateAttempts?: number;
    backoffMs?: number;
  } = {}
): Promise<SaveWithRetryResult> {
  const attempts = options.immediateAttempts ?? 3;
  const backoffMs = options.backoffMs ?? 1500;

  for (let i = 0; i < attempts; i++) {
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }

    if (await tryFetch(url, body)) {
      return { ok: true, queued: false };
    }
  }

  enqueue(url, body);
  return { ok: false, queued: true };
}

let isFlushing = false;

export async function flushPending(): Promise<{
  sent: number;
  remaining: number;
}> {
  if (isFlushing) {
    return { sent: 0, remaining: getPendingCount() };
  }

  isFlushing = true;
  let sent = 0;

  try {
    /*
      Process FIFO so dependent saves (e.g., full-survey after session-3)
      stay in order.
    */
    while (true) {
      const items = readQueue();
      if (items.length === 0) break;

      const next = items[0];
      bumpAttempts(next.id);

      const success = await tryFetch(next.url, next.body);

      if (success) {
        dequeue(next.id);
        sent += 1;
      } else {
        break;
      }
    }
  } finally {
    isFlushing = false;
  }

  return { sent, remaining: getPendingCount() };
}

export function getPendingCount(): number {
  return readQueue().length;
}
