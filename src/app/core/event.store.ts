import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { CHRONOMETER_REMOTE } from './chronometer.tokens';

export interface GaiaEvent {
  /** Also the shared document id used for synchronisation. */
  readonly id: string;
  readonly name: string;
  /** Whether chronometers of this event show the resume button. */
  readonly resumeEnabled: boolean;
}

export const EVENT_ID_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;
export const EVENT_NAME_MAX_LENGTH = 40;

/** Events live in Firestore only; without Firebase they exist in memory for the current page. */
@Injectable({ providedIn: 'root' })
export class EventStore {
  private readonly remote = inject(CHRONOMETER_REMOTE);
  private readonly state = signal<readonly GaiaEvent[]>([]);
  readonly events = this.state.asReadonly();

  constructor() {
    const stop = this.remote.watchEvents?.((events) =>
      this.state.set(Object.freeze(events.filter(({ id }) => EVENT_ID_PATTERN.test(id)))),
    );
    if (stop) {
      inject(DestroyRef).onDestroy(stop);
    }
  }

  create(name: string, resumeEnabled = false): GaiaEvent | null {
    const trimmed = name.trim().slice(0, EVENT_NAME_MAX_LENGTH);
    if (trimmed === '') {
      return null;
    }
    const event = { id: crypto.randomUUID(), name: trimmed, resumeEnabled };
    this.state.update((events) => Object.freeze([...events, event]));
    this.remote.push(event.id, {
      chronometers: [],
      name: event.name,
    });
    this.remote.setResumeEnabled?.(event.id, resumeEnabled);
    return event;
  }

  /** Resolves an event shared by a code; returns `null` when the code is invalid. */
  join(code: string): GaiaEvent | null {
    const id = code.trim();
    if (!EVENT_ID_PATTERN.test(id)) {
      return null;
    }
    return this.find(id) ?? { id, name: id, resumeEnabled: false };
  }

  find(id: string): GaiaEvent | undefined {
    return this.state().find((event) => event.id === id);
  }

  remove(id: string): void {
    this.remote.remove?.(id);
    this.state.update((events) => Object.freeze(events.filter((event) => event.id !== id)));
  }
}
