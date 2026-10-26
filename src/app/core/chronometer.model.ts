type ChronometerStatus = 'stopped' | 'running';

export interface ChronometerState {
  readonly id: string;
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
  readonly chronometers: readonly ChronometerState[];
  /** Display name of the event, shared so every device shows the same title. */
  readonly name?: string | null;
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
  const { chronometers, name } = data as Record<string, unknown>;
  if (
    !Array.isArray(chronometers) ||
    !chronometers.every(isEntry)
  ) {
    return null;
  }
  return {
    chronometers: chronometers.map((entry) => ({
      id: entry.id,
      name: entry.name,
      status: entry.status,
      startInstant: entry.startInstant,
      stopInstant: entry.stopInstant,
    })),
    name: typeof name === 'string' && name.trim() !== '' ? name : null,
  };
}
