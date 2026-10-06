import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { ChronometerSnapshot, ChronometerState, ChronometerView } from './chronometer.model';
import { CHRONOMETER_CLOCK, CHRONOMETER_REMOTE, CHRONOMETER_TIMER } from './chronometer.tokens';

const TICK_PERIOD_MILLISECONDS = 1_000;

@Injectable({ providedIn: 'root' })
export class ChronometerStore {
  private readonly clock = inject(CHRONOMETER_CLOCK);
  private readonly timer = inject(CHRONOMETER_TIMER);
  private readonly destroyRef = inject(DestroyRef);
  private readonly remote = inject(CHRONOMETER_REMOTE);

  private readonly entries = signal<readonly ChronometerState[]>(Object.freeze([]));
  private readonly nextId = signal(1);
  private readonly sharedStart = signal<number | null>(null);
  private readonly currentInstant = signal(0);
  private tickSubscription: Subscription | null = null;
  private readonly roomId = signal<string | null>(null);
  private disconnect: (() => void) | null = null;

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

  /** Joins a shared room: remote state replaces local state and later changes sync both ways. */
  joinRoom(roomId: string): void {
    this.leaveRoom();
    this.roomId.set(roomId);
    this.disconnect = this.remote.connect(roomId, (snapshot) => this.applyRemote(snapshot));
  }

  leaveRoom(): void {
    this.disconnect?.();
    this.disconnect = null;
    this.roomId.set(null);
  }

  readonly currentRoom = this.roomId.asReadonly();

  private applyRemote(snapshot: ChronometerSnapshot | null): void {
    if (snapshot === null) {
      this.publish();
      return;
    }

    this.nextId.set(snapshot.nextId);
    this.sharedStart.set(snapshot.sharedStart);
    this.currentInstant.set(this.clock());
    this.entries.set(Object.freeze(snapshot.entries.map((entry) => Object.freeze({ ...entry }))));
    this.syncTicking();
  }

  private publish(): void {
    const roomId = this.roomId();
    if (roomId === null) {
      return;
    }

    this.remote.push(roomId, {
      entries: this.entries(),
      nextId: this.nextId(),
      sharedStart: this.sharedStart(),
    });
  }

  private ensureTicking(): void {
    if (!this.tickSubscription || this.tickSubscription.closed) {
      this.tickSubscription = this.timer(TICK_PERIOD_MILLISECONDS)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.currentInstant.set(this.clock()));
    }
  }

  private syncTicking(): void {
    if (this.entries().some(({ status }) => status === 'running')) {
      this.ensureTicking();
    } else {
      this.tickSubscription?.unsubscribe();
      this.tickSubscription = null;
    }
  }
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
    this.publish();
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
    this.ensureTicking();
    this.publish();
  }

  startOne(id: string): void {
    const now = this.clock();
    this.updateOne(id, now, (entry) =>
      entry.status === 'stopped' && entry.startInstant === null
        ? { ...entry, status: 'running', startInstant: now, stopInstant: null }
        : null,
    );
  }

  resumeOne(id: string): void {
    const now = this.clock();
    this.updateOne(id, now, (entry) =>
      entry.status === 'stopped' && entry.startInstant !== null && entry.stopInstant !== null
        ? {
            ...entry,
            status: 'running',
            startInstant: now - Math.max(0, entry.stopInstant - entry.startInstant),
            stopInstant: null,
          }
        : null,
    );
  }

  private updateOne(
    id: string,
    now: number,
    change: (entry: ChronometerState) => ChronometerState | null,
  ): void {
    const target = this.entries().find((entry) => entry.id === id);
    const changed = target ? change(target) : null;
    if (!changed) {
      return;
    }

    this.currentInstant.set(now);
    this.entries.update((entries) =>
      Object.freeze(entries.map((entry) => (entry.id === id ? Object.freeze(changed) : entry))),
    );

    this.ensureTicking();
    this.publish();
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

    this.syncTicking();
    this.publish();
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
    this.ensureTicking();
    this.publish();
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
