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
