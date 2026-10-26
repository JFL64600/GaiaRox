import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { ChronometerSnapshot, ChronometerState, ChronometerView } from './chronometer.model';
import { I18n } from './i18n.service';
import { CHRONOMETER_CLOCK, CHRONOMETER_REMOTE, CHRONOMETER_TIMER } from './chronometer.tokens';

const TICK_PERIOD_MILLISECONDS = 1_000;

@Injectable({ providedIn: 'root' })
export class ChronometerStore {
  private readonly clock = inject(CHRONOMETER_CLOCK);
  private readonly timer = inject(CHRONOMETER_TIMER);
  private readonly destroyRef = inject(DestroyRef);
  private readonly remote = inject(CHRONOMETER_REMOTE);
  private readonly i18n = inject(I18n);

  private readonly entries = signal<readonly ChronometerState[]>(Object.freeze([]));
  private readonly eventNameState = signal<string | null>(null);
  private readonly currentInstant = signal(0);
  private tickSubscription: Subscription | null = null;
  private readonly roomId = signal<string | null>(null);
  private disconnect: (() => void) | null = null;
  private clockOffset = 0;
  private destroyed = false;
  private joinToken = 0;
  private remoteSeen = false;

  /** Name of the open event, kept in sync with the shared document. */
  readonly eventName = this.eventNameState.asReadonly();
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
    const token = this.joinToken;
    const connect = (): void => {
      if (token !== this.joinToken) {
        return;
      }
      this.disconnect = this.remote.connect(
        roomId,
        (snapshot) => {
          this.syncErrorState.set(false);
          this.applyRemote(snapshot);
        },
        () => this.syncErrorState.set(true),
      );
    };

    if (!this.remote.measureClockOffset) {
      connect();
      return;
    }

    // Align this device's clock with the shared server clock before applying synced instants.
    this.remote
      .measureClockOffset()
      .catch(() => 0)
      .then((offset) => {
        if (token === this.joinToken) {
          this.clockOffset = offset;
        }
        connect();
      });
  }

  /** Opens an event with empty state; the shared document then replaces it once synced. */
  openEvent(name: string | null = null): void {
    this.leaveRoom();
    this.eventNameState.set(name);
    this.tickSubscription?.unsubscribe();
    this.tickSubscription = null;
    this.entries.set(Object.freeze([]));
  }

  leaveRoom(): void {
    this.joinToken++;
    this.disconnect?.();
    this.disconnect = null;
    this.roomId.set(null);
    this.syncErrorState.set(false);
    this.clockOffset = 0;
    this.remoteSeen = false;
  }

  private now(): number {
    return this.clock() + this.clockOffset;
  }

  /** Current synchronized instant, for live displays that refresh outside the store tick. */
  instant(): number {
    return this.now();
  }
  readonly currentRoom = this.roomId.asReadonly();
  private readonly syncErrorState = signal(false);
  /** True when the last sync attempt failed or the room held invalid data. */
  readonly syncError = this.syncErrorState.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.leaveRoom();
    });
  }

  private applyRemote(snapshot: ChronometerSnapshot | null): void {
    if (snapshot === null) {
      if (this.remoteSeen) {
        // The event was deleted remotely: stop syncing so we don't recreate it.
        this.leaveRoom();
        this.entries.set(Object.freeze([]));
        this.syncTicking();
        return;
      }
      this.publish();
      return;
    }
    this.remoteSeen = true;

    if (snapshot.name) {
      this.eventNameState.set(snapshot.name);
    }
    this.currentInstant.set(this.now());
    this.entries.set(
      Object.freeze(snapshot.chronometers.map((entry) => Object.freeze({ ...entry }))),
    );
    this.syncTicking();
  }

  private publish(): void {
    const roomId = this.roomId();
    if (roomId === null) {
      return;
    }

    this.remote.push(
      roomId,
      {
        chronometers: this.entries(),
        name: this.eventNameState(),
      },
      () => this.syncErrorState.set(true),
    );
  }

  private ensureTicking(): void {
    if (this.destroyed) {
      return;
    }
    if (!this.tickSubscription || this.tickSubscription.closed) {
      this.tickSubscription = this.timer(TICK_PERIOD_MILLISECONDS)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.currentInstant.set(this.now()));
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
    const id = crypto.randomUUID();
    const chronometerName =
      name?.trim() || this.i18n.t('chronometer.defaultName', { n: this.entries().length + 1 });
    this.entries.update((entries) =>
      Object.freeze([
        ...entries,
        Object.freeze({
          id,
          name: chronometerName,
          status: 'stopped' as const,
          startInstant: null,
          stopInstant: null,
        }),
      ]),
    );
    this.publish();
  }

  startOne(id: string): void {
    const now = this.now();
    this.updateOne(id, now, (entry) => {
      if (entry.status !== 'stopped' || entry.startInstant !== null) {
        return null;
      }
      return { ...entry, status: 'running', startInstant: now, stopInstant: null };
    });
  }

  resumeOne(id: string): void {
    const now = this.now();
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

    const stopInstant = this.now();
    const stoppedEntries = Object.freeze(
      entries.map((entry) =>
        entry.id === id
          ? Object.freeze({
              ...entry,
              status: 'stopped' as const,
              stopInstant,
            })
          : entry,
      ),
    );

    this.entries.set(stoppedEntries);

    this.syncTicking();
    this.publish();
  }
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
