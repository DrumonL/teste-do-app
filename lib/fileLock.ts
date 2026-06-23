/*
  Serializes async operations by key.
  Two operations with the same key wait for each other; different keys run concurrently.
  Use the file path as the key to protect read-modify-write sequences against races.
*/

const locks = new Map<string, Promise<unknown>>();

export async function withFileLock<T>(
  key: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();

  const current = previous
    .catch(() => undefined)
    .then(() => fn());

  locks.set(key, current);

  try {
    return await current;
  } finally {
    if (locks.get(key) === current) {
      locks.delete(key);
    }
  }
}
