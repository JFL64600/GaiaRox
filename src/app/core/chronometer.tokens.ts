import { InjectionToken } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { ChronometerSnapshot } from './chronometer.model';

export type ChronometerClock = () => number;
export type ChronometerTimer = (periodMilliseconds: number) => Observable<unknown>;

export const CHRONOMETER_CLOCK = new InjectionToken<ChronometerClock>('CHRONOMETER_CLOCK', {
  providedIn: 'root',
  factory: () => Date.now,
});

export const CHRONOMETER_TIMER = new InjectionToken<ChronometerTimer>('CHRONOMETER_TIMER', {
  providedIn: 'root',
  factory: () => (periodMilliseconds) => timer(periodMilliseconds, periodMilliseconds),
});

export interface ChronometerRemote {
  /** Subscribes to a room; `null` means the room has no data yet. Returns an unsubscribe function. */
  connect(roomId: string, onSnapshot: (snapshot: ChronometerSnapshot | null) => void): () => void;
  push(roomId: string, snapshot: ChronometerSnapshot): void;
}

export const CHRONOMETER_REMOTE = new InjectionToken<ChronometerRemote>('CHRONOMETER_REMOTE', {
  providedIn: 'root',
  factory: () => ({ connect: () => () => undefined, push: () => undefined }),
});
