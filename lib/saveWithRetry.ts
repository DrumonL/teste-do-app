/*
  Client-side save with automatic retry and persistent IndexedDB queue.
  - Tries immediately a few times with backoff.
  - If all immediate attempts fail, queues the request in IndexedDB.
  - flushPending() drains the queue. Call it on app mount, on focus, and on a timer.
  - The queue is processed in FIFO order, so dependent saves stay in order.
  - Migrates the old localStorage queue once for backward compatibility.
*/

const PENDING_KEY = "pending-saves-v1";
const DB_NAME = "meat-app-offline";
const DB_VERSION = 2;
const STORE_NAME = "pendingSaves";
const BACKUP_STORE_NAME = "localBackups";
const META_STORE_NAME = "metadata";

export type PendingSave = {
  id: string;
  url: string;
  body: unknown;
  createdAt: string;
  attempts: number;
};

export type LocalBackup = {
  id: string;
  url: string;
  body: unknown;
  createdAt: string;
};

export type LocalBackupStats = {
  backupCount: number;
  participantCount: number;
  eventCount: number;
  lastBackupAt: string;
};

let migrationPromise: Promise<void> | null = null;

function readLegacyQueue(): PendingSave[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLegacyQueue(items: PendingSave[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_KEY, JSON.stringify(items));
}

function canUseIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openQueueDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!canUseIndexedDb()) {
      reject(new Error("IndexedDB is not available."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(BACKUP_STORE_NAME)) {
        db.createObjectStore(BACKUP_STORE_NAME, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(META_STORE_NAME)) {
        db.createObjectStore(META_STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
) {
  const db = await openQueueDb();

  try {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    return await requestToPromise(callback(store));
  } finally {
    db.close();
  }
}

async function addPendingSave(item: PendingSave) {
  await withStore(STORE_NAME, "readwrite", (store) => store.put(item));
}

async function getPendingSavesFromIndexedDb(): Promise<PendingSave[]> {
  const items = await withStore(STORE_NAME, "readonly", (store) => store.getAll());

  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function deletePendingSave(id: string) {
  await withStore(STORE_NAME, "readwrite", (store) => store.delete(id));
}

async function addLocalBackup(item: LocalBackup) {
  await withStore(BACKUP_STORE_NAME, "readwrite", (store) => store.put(item));
}

async function getLocalBackupsFromIndexedDb(): Promise<LocalBackup[]> {
  const items = await withStore(BACKUP_STORE_NAME, "readonly", (store) =>
    store.getAll()
  );

  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function setMetadataValue(key: string, value: string) {
  await withStore(META_STORE_NAME, "readwrite", (store) =>
    store.put({ key, value })
  );
}

async function getMetadataValue(key: string) {
  const row = await withStore(META_STORE_NAME, "readonly", (store) =>
    store.get(key)
  );

  return typeof row?.value === "string" ? row.value : "";
}

async function migrateLegacyQueue() {
  if (typeof window === "undefined") return;

  const legacyItems = readLegacyQueue();
  if (legacyItems.length === 0) return;

  if (!canUseIndexedDb()) return;

  for (const item of legacyItems) {
    await addPendingSave(item);
  }

  localStorage.removeItem(PENDING_KEY);
}

async function ensureMigrated() {
  if (!migrationPromise) {
    migrationPromise = migrateLegacyQueue().catch(() => undefined);
  }

  await migrationPromise;
}

export async function getPendingSaves(): Promise<PendingSave[]> {
  if (typeof window === "undefined") return [];

  await ensureMigrated();

  if (!canUseIndexedDb()) {
    return readLegacyQueue();
  }

  try {
    return await getPendingSavesFromIndexedDb();
  } catch {
    return readLegacyQueue();
  }
}

function collectParticipantIds(value: unknown, output: Set<string>) {
  if (!value || typeof value !== "object") return;

  if (Array.isArray(value)) {
    value.forEach((item) => collectParticipantIds(item, output));
    return;
  }

  const row = value as Record<string, unknown>;

  ["participant_id", "participantId"].forEach((key) => {
    const id = row[key];

    if (typeof id === "string" && id.trim()) {
      output.add(id);
    }
  });

  Object.values(row).forEach((item) => collectParticipantIds(item, output));
}

function countClickEvents(value: unknown): number {
  if (!value || typeof value !== "object") return 0;

  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countClickEvents(item), 0);
  }

  const row = value as Record<string, unknown>;
  const clickRows = row.clickRows;
  let count = Array.isArray(clickRows) ? clickRows.length : 0;

  Object.entries(row).forEach(([key, item]) => {
    if (key !== "clickRows") {
      count += countClickEvents(item);
    }
  });

  return count;
}

export async function getLocalBackups(): Promise<LocalBackup[]> {
  if (typeof window === "undefined") return [];

  if (!canUseIndexedDb()) {
    return [];
  }

  try {
    return await getLocalBackupsFromIndexedDb();
  } catch {
    return [];
  }
}

export async function getLastBackupAt(): Promise<string> {
  if (typeof window === "undefined" || !canUseIndexedDb()) return "";

  try {
    return await getMetadataValue("lastBackupAt");
  } catch {
    return "";
  }
}

export async function markBackupExported(): Promise<string> {
  const exportedAt = new Date().toISOString();

  if (typeof window !== "undefined" && canUseIndexedDb()) {
    try {
      await setMetadataValue("lastBackupAt", exportedAt);
    } catch {
      localStorage.setItem("lastBackupAt", exportedAt);
    }
  }

  return exportedAt;
}

export async function getLocalBackupStats(): Promise<LocalBackupStats> {
  const backups = await getLocalBackups();
  const participantIds = new Set<string>();

  backups.forEach((backup) => collectParticipantIds(backup.body, participantIds));

  return {
    backupCount: backups.length,
    participantCount: participantIds.size,
    eventCount: backups.reduce(
      (total, backup) => total + countClickEvents(backup.body),
      0
    ),
    lastBackupAt: await getLastBackupAt(),
  };
}

async function saveLocalBackup(url: string, body: unknown) {
  if (!canUseIndexedDb()) return;

  const item: LocalBackup = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    body,
    createdAt: new Date().toISOString(),
  };

  try {
    await addLocalBackup(item);
  } catch {
    // Keep network saving available even if browser storage is blocked/full.
  }
}

async function enqueue(url: string, body: unknown) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const item: PendingSave = {
    id,
    url,
    body,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  await ensureMigrated();

  if (!canUseIndexedDb()) {
    const items = readLegacyQueue();
    items.push(item);
    writeLegacyQueue(items);
    return id;
  }

  try {
    await addPendingSave(item);
  } catch {
    const items = readLegacyQueue();
    items.push(item);
    writeLegacyQueue(items);
  }

  return id;
}

async function dequeue(id: string) {
  await ensureMigrated();

  if (!canUseIndexedDb()) {
    writeLegacyQueue(readLegacyQueue().filter((item) => item.id !== id));
    return;
  }

  try {
    await deletePendingSave(id);
  } catch {
    writeLegacyQueue(readLegacyQueue().filter((item) => item.id !== id));
  }
}

async function bumpAttempts(id: string) {
  const items = await getPendingSaves();
  const item = items.find((i) => i.id === id);

  if (item) {
    item.attempts += 1;

    if (!canUseIndexedDb()) {
      writeLegacyQueue(items);
      return;
    }

    try {
      await addPendingSave(item);
    } catch {
      writeLegacyQueue(items);
    }
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

  await saveLocalBackup(url, body);

  for (let i = 0; i < attempts; i++) {
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }

    if (await tryFetch(url, body)) {
      return { ok: true, queued: false };
    }
  }

  await enqueue(url, body);
  return { ok: false, queued: true };
}

let isFlushing = false;

export async function flushPending(): Promise<{
  sent: number;
  remaining: number;
}> {
  if (isFlushing) {
    return { sent: 0, remaining: await getPendingCount() };
  }

  isFlushing = true;
  let sent = 0;

  try {
    /*
      Process FIFO so dependent saves (e.g., full-survey after session-3)
      stay in order.
    */
    while (true) {
      const items = await getPendingSaves();
      if (items.length === 0) break;

      const next = items[0];
      await bumpAttempts(next.id);

      const success = await tryFetch(next.url, next.body);

      if (success) {
        await dequeue(next.id);
        sent += 1;
      } else {
        break;
      }
    }
  } finally {
    isFlushing = false;
  }

  return { sent, remaining: await getPendingCount() };
}

export async function getPendingCount(): Promise<number> {
  return (await getPendingSaves()).length;
}
