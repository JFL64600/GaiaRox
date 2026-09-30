import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { ChronometerState, ChronometerView } from './chronometer.model';
import { CHRONOMETER_CLOCK, CHRONOMETER_TIMER } from './chronometer.tokens';

const TICK_PERIOD_MILLISECONDS = 1_000;

@Injectable({ providedIn: 'root' })
export class ChronometerStore {
  private readonly clock = inject(CHRONOMETER_CLOCK);
  private readonly timer = inject(CHRONOMETER_TIMER);
  private readonly destroyRef = inject(DestroyRef);

  private readonly entries = signal<readonly ChronometerState[]>(Object.freeze([]));
  private readonly nextId = signal(1);
  private readonly sharedStart = signal<number | null>(null);
  private readonly currentInstant = signal(0);
  private tickSubscription: Subscription | null = null;

  readonly started = computed(() => this.sharedStart() !== null);
  readonly running = computed(() => this.entries().some(({ status }) => status === 'running'));
  readonly allStopped = computed(
    () =>
      this.started() &&
      this.entries().length > 0 &&
      this.entries().every(({ status }) => status === 'stopped'),
  );
  readonly chronometers = computed<readonly ChronometerView[]>(() => {
    const currentInstant = this.currentInstant();

    return Object.freeze(
      this.entries().map((entry) => {
        const endInstant = entry.status === 'running' ? currentInstant : entry.stopInstant;
        const elapsedMilliseconds =
          entry.startInstant === null || endInstant === null
            ? 0
            : Math.max(0, endInstant - entry.startInstant);

        return Object.freeze({
          ...entry,
          elapsedMilliseconds,
          formattedElapsed: formatElapsed(elapsedMilliseconds),
        });
      }),
    );
  });

  add(name?: string): void {
    if (this.started()) {
      return;
    }

    const displayNumber = this.nextId();
    const id = `chronometer-${displayNumber}`;
    const chronometerName = name?.trim() || `Chronometer ${displayNumber}`;
    this.nextId.update((value) => value + 1);
    this.entries.update((entries) =>
      Object.freeze([
        ...entries,
        Object.freeze({
          id,
          displayNumber,
          name: chronometerName,
          status: 'stopped' as const,
          startInstant: null,
          stopInstant: null,
        }),
      ]),
    );
  }

  start(): void {
    if (this.started() || this.entries().length === 0) {
      return;
    }

    const startInstant = this.clock();
    const runningEntries = Object.freeze(
      this.entries().map((entry) =>
        Object.freeze({
          ...entry,
          status: 'running' as const,
          startInstant,
          stopInstant: null,
        }),
      ),
    );

    this.currentInstant.set(startInstant);
    this.sharedStart.set(startInstant);
    this.entries.set(runningEntries);

    this.tickSubscription = this.timer(TICK_PERIOD_MILLISECONDS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.currentInstant.set(this.clock()));
  }

  stop(id: string): void {
    const entries = this.entries();
    if (!entries.some((entry) => entry.id === id && entry.status === 'running')) {
      return;
    }

    const stopInstant = this.clock();
    const stoppedEntries = entries.map((entry) =>
      entry.id === id
        ? Object.freeze({
            ...entry,
            status: 'stopped' as const,
            stopInstant,
          })
        : entry,
    );

    const sortedEntries = Object.freeze(
      [...stoppedEntries].sort(
        (a, b) =>
          statusRank(a) - statusRank(b) ||
          elapsedAtInstant(a, stopInstant) - elapsedAtInstant(b, stopInstant) ||
          numericSuffix(a.id) - numericSuffix(b.id),
      ),
    );

    this.entries.set(sortedEntries);

    if (!sortedEntries.some(({ status }) => status === 'running')) {
      this.tickSubscription?.unsubscribe();
      this.tickSubscription = null;
    }
  }

  resume(): void {
    if (!this.allStopped()) {
      return;
    }

    const now = this.clock();
    const resumedEntries = Object.freeze(
      this.entries().map((entry) => {
        const frozenElapsed =
          entry.startInstant === null || entry.stopInstant === null
            ? 0
            : Math.max(0, entry.stopInstant - entry.startInstant);

        return Object.freeze({
          ...entry,
          status: 'running' as const,
          startInstant: now - frozenElapsed,
          stopInstant: null,
        });
      }),
    );

    this.currentInstant.set(now);
    this.entries.set(resumedEntries);

    this.tickSubscription = this.timer(TICK_PERIOD_MILLISECONDS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.currentInstant.set(this.clock()));
  }
}

function statusRank(entry: ChronometerState): number {
  return entry.status === 'stopped' ? 0 : 1;
}

function elapsedAtInstant(entry: ChronometerState, referenceInstant: number): number {
  if (entry.startInstant === null) {
    return Number.POSITIVE_INFINITY;
  }

  const endInstant = entry.status === 'stopped' ? entry.stopInstant! : referenceInstant;
  return Math.max(0, endInstant - entry.startInstant);
}

function numericSuffix(id: string): number {
  const match = /(\d+)$/.exec(id);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

export function formatElapsed(elapsedMilliseconds: number): string {
  const safeElapsed = Math.max(0, Math.floor(elapsedMilliseconds));
  const minutes = Math.floor(safeElapsed / 60_000);
  const seconds = Math.floor((safeElapsed % 60_000) / 1_000);
  const milliseconds = safeElapsed % 1_000;

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}
