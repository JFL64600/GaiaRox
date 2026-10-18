import { Injectable, signal } from '@angular/core';
import { eventStorageKey } from './chronometer.store';

export interface GaiaEvent {
  /** Also the shared room code used for synchronisation. */
  readonly id: string;
  readonly name: string;
}

export const EVENTS_STORAGE_KEY = 'gaiarox.events';
export const EVENT_ID_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;
export const EVENT_NAME_MAX_LENGTH = 40;

@Injectable({ providedIn: 'root' })
export class EventStore {
  private readonly state = signal<readonly GaiaEvent[]>(this.load());
  readonly events = this.state.asReadonly();

  create(name: string): GaiaEvent | null {
    const trimmed = name.trim().slice(0, EVENT_NAME_MAX_LENGTH);
    if (trimmed === '') {
      return null;
    }
    const event = { id: crypto.randomUUID().replaceAll('-', '').slice(0, 12), name: trimmed };
    this.save([...this.state(), event]);
    return event;
  }

  /** Adds an event shared by a code; returns `null` when the code is invalid. */
  join(code: string): GaiaEvent | null {
    const id = code.trim();
    if (!EVENT_ID_PATTERN.test(id)) {
      return null;
    }
    const existing = this.state().find((event) => event.id === id);
    if (existing) {
      return existing;
    }
    const event = { id, name: id };
    this.save([...this.state(), event]);
    return event;
  }

  find(id: string): GaiaEvent | undefined {
    return this.state().find((event) => event.id === id);
  }

  remove(id: string): void {
    this.save(this.state().filter((event) => event.id !== id));
    try {
      globalThis.localStorage?.removeItem(eventStorageKey(id));
    } catch {
      // Storage may be unavailable.
    }
  }

  private load(): readonly GaiaEvent[] {
    try {
      const parsed: unknown = JSON.parse(globalThis.localStorage?.getItem(EVENTS_STORAGE_KEY) ?? '[]');
      return Array.isArray(parsed)
        ? parsed.filter(
            (event): event is GaiaEvent =>
              typeof event?.id === 'string' &&
              EVENT_ID_PATTERN.test(event.id) &&
              typeof event?.name === 'string',
          )
        : [];
    } catch {
      return [];
    }
  }

  private save(events: readonly GaiaEvent[]): void {
    this.state.set(Object.freeze(events));
    try {
      globalThis.localStorage?.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch {
      // Persistence is best effort.
    }
  }
}
