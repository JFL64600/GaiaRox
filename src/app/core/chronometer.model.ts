export type ChronometerStatus = 'stopped' | 'running';

export interface ChronometerState {
  readonly id: string;
  /** Stable display number assigned on creation; does not change when the list re-sorts. */
  readonly displayNumber: number;
  readonly name: string;
  readonly status: ChronometerStatus;
  readonly startInstant: number | null;
  readonly stopInstant: number | null;
}

export interface ChronometerView extends ChronometerState {
  readonly elapsedMilliseconds: number;
  readonly formattedElapsed: string;
}

/** Shareable chronometer state exchanged with a remote store. */
export interface ChronometerSnapshot {
  readonly entries: readonly ChronometerState[];
  readonly nextId: number;
  readonly sharedStart: number | null;
}

function isInstant(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function isEntry(value: unknown): value is ChronometerState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry['id'] === 'string' &&
    Number.isInteger(entry['displayNumber']) &&
    typeof entry['name'] === 'string' &&
    (entry['status'] === 'running' || entry['status'] === 'stopped') &&
    isInstant(entry['startInstant']) &&
    isInstant(entry['stopInstant'])
  );
}

/** Returns a clean snapshot, or `null` when remote data does not have the expected shape. */
export function parseSnapshot(data: unknown): ChronometerSnapshot | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  const { entries, nextId, sharedStart } = data as Record<string, unknown>;
  if (
    !Array.isArray(entries) ||
    !entries.every(isEntry) ||
    !Number.isInteger(nextId) ||
    !isInstant(sharedStart)
  ) {
    return null;
  }
  return {
    entries: entries.map((entry) => ({
      id: entry.id,
      displayNumber: entry.displayNumber,
      name: entry.name,
      status: entry.status,
      startInstant: entry.startInstant,
      stopInstant: entry.stopInstant,
    })),
    nextId: nextId as number,
    sharedStart,
  };
}
