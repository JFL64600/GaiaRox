import { InjectionToken } from '@angular/core';
import { Observable, timer } from 'rxjs';

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
