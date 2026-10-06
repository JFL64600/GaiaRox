import { TestBed } from '@angular/core/testing';
import { NEVER } from 'rxjs';
import { ChronometerSnapshot } from './chronometer.model';
import { ChronometerStore } from './chronometer.store';
import {
  CHRONOMETER_CLOCK,
  CHRONOMETER_REMOTE,
  CHRONOMETER_TIMER,
  ChronometerRemote,
} from './chronometer.tokens';

describe('ChronometerStore cloud sync', () => {
  let pushes: { roomId: string; snapshot: ChronometerSnapshot }[];
  let emit: (snapshot: ChronometerSnapshot | null) => void;
  let disconnected: boolean;
  let store: ChronometerStore;

  beforeEach(() => {
    pushes = [];
    disconnected = false;
    emit = () => undefined;
    const remote: ChronometerRemote = {
      connect: (_roomId, onSnapshot) => {
        emit = onSnapshot;
        return () => {
          disconnected = true;
        };
      },
      push: (roomId, snapshot) => pushes.push({ roomId, snapshot }),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: CHRONOMETER_CLOCK, useValue: () => 5_000 },
        { provide: CHRONOMETER_TIMER, useValue: () => NEVER },
        { provide: CHRONOMETER_REMOTE, useValue: remote },
      ],
    });
    store = TestBed.inject(ChronometerStore);
  });

  it('does not push before joining a room', () => {
    store.add('A');
    expect(pushes).toEqual([]);
  });

  it('pushes local changes once joined', () => {
    store.joinRoom('room-123');
    store.add('A');
    store.start();

    expect(pushes.at(-1)?.roomId).toBe('room-123');
    expect(pushes.at(-1)?.snapshot.entries[0].status).toBe('running');
    expect(pushes.at(-1)?.snapshot.sharedStart).toBe(5_000);
  });

  it('applies remote state without echoing it back', () => {
    store.joinRoom('room-123');
    emit({
      nextId: 3,
      sharedStart: 1_000,
      entries: [
        {
          id: 'chronometer-1',
          displayNumber: 1,
          name: 'Remote',
          status: 'running',
          startInstant: 1_000,
          stopInstant: null,
        },
      ],
    });

    expect(store.chronometers()[0].name).toBe('Remote');
    expect(store.chronometers()[0].elapsedMilliseconds).toBe(4_000);
    expect(store.started()).toBe(true);
    expect(pushes).toEqual([]);
  });

  it('seeds an empty room with local state', () => {
    store.add('A');
    store.joinRoom('room-123');
    emit(null);

    expect(pushes.at(-1)?.snapshot.entries.length).toBe(1);
  });

  it('stops syncing after leaving the room', () => {
    store.joinRoom('room-123');
    store.leaveRoom();
    store.add('A');

    expect(disconnected).toBe(true);
    expect(store.currentRoom()).toBeNull();
    expect(pushes).toEqual([]);
  });
});
