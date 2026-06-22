export function seededShuffle<T>(items: T[], seed: string): T[] {
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }

  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    hash = Math.imul(48271, hash) % 2147483647;
    const j = Math.abs(hash) % (i + 1);

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function createRandomizationSeed(
  participantId: string,
  sessionNumber: number
) {
  return `${participantId}-session-${sessionNumber}`;
}
