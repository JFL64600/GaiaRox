import { resetLocalStorage } from './testing-storage';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { ChronometerStore, formatElapsed } from './chronometer.store';
import { CHRONOMETER_CLOCK, CHRONOMETER_TIMER, ChronometerTimer } from './chronometer.tokens';

interface StoreHarness {
  readonly store: ChronometerStore;
  readonly tick: Subject<void>;
  readonly clockCalls: () => number;
  readonly timerCalls: () => number;
  setNow(value: number): void;
  /** Starts every chronometer at the current instant without counting clock reads. */
  startAll(): void;
}

function createHarness(): StoreHarness {
  resetLocalStorage();
  let now = 0;
  let clockCallCount = 0;
  let timerCallCount = 0;
  let counting = true;
  const tick = new Subject<void>();
  const controlledTimer: ChronometerTimer = (periodMilliseconds) => {
    expect(periodMilliseconds).toBe(1_000);
    timerCallCount += 1;
    return tick;
  };

  TestBed.configureTestingModule({
    providers: [
      ChronometerStore,
      {
        provide: CHRONOMETER_CLOCK,
        useValue: () => {
          if (counting) {
            clockCallCount += 1;
          }
          return now;
        },
      },
      { provide: CHRONOMETER_TIMER, useValue: controlledTimer },
    ],
  });

  const store = TestBed.inject(ChronometerStore);

  return {
    store,
    tick,
    clockCalls: () => clockCallCount,
    timerCalls: () => timerCallCount,
    setNow: (value) => {
      now = value;
    },
    startAll: () => {
      counting = false;
      store.chronometers().forEach(({ id }) => store.startOne(id));
      counting = true;
    },
  };
}

describe('ChronometerStore', () => {
  beforeEach(() => {
    let count = 0;
    vi.spyOn(crypto, 'randomUUID').mockImplementation(
      () => `chronometer-${++count}` as ReturnType<typeof crypto.randomUUID>,
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('never writes to local storage', () => {
    resetLocalStorage();
    const setItem = vi.spyOn(globalThis.localStorage, 'setItem');
    const { store, setNow } = createHarness();
    setNow(5_000);
    store.add('A');
    store.startOne('chronometer-1');

    expect(setItem).not.toHaveBeenCalled();
  });

  it('starts with an empty chronometer collection', () => {
    const { store } = createHarness();

    expect(store.chronometers()).toEqual([]);
  });

  it('appends a new stable, zeroed, stopped chronometer per add() call', () => {
    const { store } = createHarness();

    store.add();
    store.add();
    store.add();

    const entries = store.chronometers();
    expect(entries.map(({ id }) => id)).toEqual([
      'chronometer-1',
      'chronometer-2',
      'chronometer-3',
    ]);
    expect(
      entries.every(
        ({ status, startInstant, stopInstant, elapsedMilliseconds, formattedElapsed }) =>
          status === 'stopped' &&
          startInstant === null &&
          stopInstant === null &&
          elapsedMilliseconds === 0 &&
          formattedElapsed === '00:00.000',
      ),
    ).toBe(true);
    expect(Object.isFrozen(entries[0])).toBe(true);
  });

  it('stores the trimmed name given to add() and defaults blank names', () => {
    const { store } = createHarness();

    store.add('  Xabi  ');
    store.add('   ');
    store.add();

    expect(store.chronometers().map(({ name }) => name)).toEqual([
      'Xabi',
      '2. kronometroa',
      '3. kronometroa',
    ]);
  });

  it('keeps previously added entries stable and identity-preserving across add() calls', () => {
    const { store } = createHarness();
    store.add();
    const firstRead = store.chronometers();

    store.add();

    expect(store.chronometers()[0].id).toBe(firstRead[0].id);
    expect(store.chronometers()).toHaveLength(2);
  });

  it('allows add() while a chronometer is running', () => {
    const harness = createHarness();
    harness.store.add();
    harness.startAll();

    harness.store.add();

    expect(harness.store.chronometers()).toHaveLength(2);
    expect(harness.store.chronometers()[1].status).toBe('stopped');
  });

  it('starts one entry from the clock and leaves the others untouched', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.add();
    harness.setNow(42_000);

    harness.store.startOne('chronometer-2');

    expect(harness.clockCalls()).toBe(1);
    expect(harness.timerCalls()).toBe(1);
    expect(harness.store.chronometers()[0]).toMatchObject({ status: 'stopped', startInstant: null });
    expect(harness.store.chronometers()[1]).toMatchObject({
      status: 'running',
      startInstant: 42_000,
      stopInstant: null,
    });
  });

  it('ignores startOne for unknown or already started chronometers', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.startOne('chronometer-1');
    harness.setNow(5_000);

    harness.store.startOne('chronometer-1');
    harness.store.startOne('unknown');

    expect(harness.timerCalls()).toBe(1);
    expect(harness.store.chronometers()[0]?.startInstant).toBe(0);
  });

  it('updates on timer emissions from clock time and tolerates missed-time jumps', () => {
    const harness = createHarness();
    harness.store.add();
    harness.setNow(10_000);
    harness.startAll();

    harness.setNow(11_000);
    harness.tick.next();
    expect(harness.store.chronometers()[0]?.formattedElapsed).toBe('00:01.000');

    harness.setNow(75_678);
    harness.tick.next();
    expect(harness.store.chronometers()[0]?.elapsedMilliseconds).toBe(65_678);
    expect(harness.store.chronometers()[0]?.formattedElapsed).toBe('01:05.678');
    expect(harness.clockCalls()).toBe(2);
  });

  it('clamps elapsed time when the clock moves before the start', () => {
    const harness = createHarness();
    harness.store.add();
    harness.setNow(1_000);
    harness.startAll();
    harness.setNow(500);
    harness.tick.next();

    expect(harness.store.chronometers()[0]?.formattedElapsed).toBe('00:00.000');
  });

  it('stops one entry at its click instant while the others continue running', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.add();
    harness.startAll();
    harness.setNow(2_345);

    harness.store.stop('chronometer-1');

    const stopped = harness.store.chronometers()[0];
    expect(stopped).toMatchObject({
      status: 'stopped',
      startInstant: 0,
      stopInstant: 2_345,
      elapsedMilliseconds: 2_345,
      formattedElapsed: '00:02.345',
    });
    expect(harness.store.chronometers()[1]?.status).toBe('running');

    harness.setNow(5_000);
    harness.tick.next();

    expect(harness.store.chronometers()[0]?.formattedElapsed).toBe('00:02.345');
    expect(harness.store.chronometers()[1]?.formattedElapsed).toBe('00:05.000');
  });

  it('keeps the chronometer order after each stop click', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.add();
    harness.store.add();
    harness.startAll();

    const order = ['chronometer-1', 'chronometer-2', 'chronometer-3'];

    harness.setNow(500);
    harness.store.stop('chronometer-3');
    expect(harness.store.chronometers().map(({ id }) => id)).toEqual(order);

    harness.setNow(3_000);
    harness.store.stop('chronometer-1');
    expect(harness.store.chronometers().map(({ id }) => id)).toEqual(order);

    harness.setNow(1_500);
    harness.store.stop('chronometer-2');
    expect(harness.store.chronometers().map(({ id }) => id)).toEqual(order);
    expect(
      harness.store.chronometers().map(({ elapsedMilliseconds }) => elapsedMilliseconds),
    ).toEqual([3_000, 1_500, 500]);
  });

  it('ignores unknown and repeated stop actions without reading the clock', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.stop('chronometer-1');
    expect(harness.clockCalls()).toBe(0);

    harness.startAll();
    harness.setNow(1_000);
    harness.store.stop('chronometer-1');
    const clockCallsAfterStop = harness.clockCalls();

    harness.store.stop('chronometer-1');
    harness.store.stop('unknown');

    expect(harness.clockCalls()).toBe(clockCallsAfterStop);
    expect(harness.store.chronometers()[0]?.stopInstant).toBe(1_000);
  });

  it('tears down ticking after every entry stops', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.add();
    harness.startAll();
    expect(harness.tick.observed).toBe(true);

    harness.store.chronometers().forEach(({ id }, index) => {
      harness.setNow((index + 1) * 1_000);
      harness.store.stop(id);
    });

    expect(harness.store.chronometers().every(({ status }) => status === 'stopped')).toBe(true);
    expect(harness.tick.observed).toBe(false);
  });

  it('resumes one entry by continuing from its own frozen elapsed value', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.add();
    harness.startAll();
    harness.setNow(1_000);
    harness.store.stop('chronometer-1');
    harness.setNow(3_000);
    harness.store.stop('chronometer-2');
    expect(harness.tick.observed).toBe(false);

    harness.setNow(50_000);
    harness.store.resumeOne('chronometer-2');

    expect(harness.timerCalls()).toBe(2);
    expect(harness.tick.observed).toBe(true);
    expect(harness.store.chronometers()[0]).toMatchObject({
      status: 'stopped',
      elapsedMilliseconds: 1_000,
    });
    expect(harness.store.chronometers()[1]).toMatchObject({
      status: 'running',
      stopInstant: null,
      elapsedMilliseconds: 3_000,
    });

    harness.setNow(50_400);
    harness.tick.next();
    expect(harness.store.chronometers()[1]?.formattedElapsed).toBe('00:03.400');
  });

  it('ignores resumeOne for entries that are running, never started or unknown', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.add();
    harness.store.startOne('chronometer-1');

    harness.store.resumeOne('chronometer-1');
    harness.store.resumeOne('chronometer-2');
    harness.store.resumeOne('unknown');

    expect(harness.timerCalls()).toBe(1);
    expect(harness.store.chronometers()[1]).toMatchObject({
      status: 'stopped',
      startInstant: null,
    });
  });

  it('supports repeated stop-then-resume cycles, continuing elapsed time each round', () => {
    const harness = createHarness();
    harness.store.add();
    harness.startAll();
    harness.setNow(1_000);
    harness.store.stop('chronometer-1');
    expect(harness.store.chronometers()[0]?.elapsedMilliseconds).toBe(1_000);

    harness.setNow(5_000);
    harness.store.resumeOne('chronometer-1');
    expect(harness.store.chronometers()[0]?.elapsedMilliseconds).toBe(1_000);

    harness.setNow(6_000);
    harness.store.stop('chronometer-1');
    expect(harness.store.chronometers()[0]?.elapsedMilliseconds).toBe(2_000);

    harness.setNow(10_000);
    harness.store.resumeOne('chronometer-1');

    expect(harness.timerCalls()).toBe(3);
    expect(harness.store.chronometers()[0]?.status).toBe('running');
    expect(harness.store.chronometers()[0]?.elapsedMilliseconds).toBe(2_000);
  });

  it('creates an independent, empty collection for a fresh root injector lifetime', () => {
    resetLocalStorage();
    const root = TestBed.inject(EnvironmentInjector);
    const firstLifetime = createEnvironmentInjector([ChronometerStore], root);
    const secondLifetime = createEnvironmentInjector([ChronometerStore], root);
    secondLifetime.get(ChronometerStore);

    firstLifetime.get(ChronometerStore).add();

    expect(firstLifetime.get(ChronometerStore).chronometers()).toHaveLength(1);
    expect(secondLifetime.get(ChronometerStore).chronometers()).toHaveLength(0);
    expect(firstLifetime.get(ChronometerStore)).not.toBe(secondLifetime.get(ChronometerStore));

    firstLifetime.destroy();
    secondLifetime.destroy();
  });
});

describe('formatElapsed', () => {
  it.each([
    [0, '00:00.000'],
    [61_005, '01:01.005'],
    [6_000_001, '100:00.001'],
    [-1, '00:00.000'],
  ])('formats %d as %s', (elapsed, expected) => {
    expect(formatElapsed(elapsed)).toBe(expected);
  });
});
