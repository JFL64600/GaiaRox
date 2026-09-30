import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ChronometerStore, formatElapsed } from './chronometer.store';
import { CHRONOMETER_CLOCK, CHRONOMETER_TIMER, ChronometerTimer } from './chronometer.tokens';

interface StoreHarness {
  readonly store: ChronometerStore;
  readonly tick: Subject<void>;
  readonly clockCalls: () => number;
  readonly timerCalls: () => number;
  setNow(value: number): void;
}

function createHarness(): StoreHarness {
  let now = 0;
  let clockCallCount = 0;
  let timerCallCount = 0;
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
          clockCallCount += 1;
          return now;
        },
      },
      { provide: CHRONOMETER_TIMER, useValue: controlledTimer },
    ],
  });

  return {
    store: TestBed.inject(ChronometerStore),
    tick,
    clockCalls: () => clockCallCount,
    timerCalls: () => timerCallCount,
    setNow: (value) => {
      now = value;
    },
  };
}

describe('ChronometerStore', () => {
  afterEach(() => TestBed.resetTestingModule());

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

  it('keeps previously added entries stable and identity-preserving across add() calls', () => {
    const { store } = createHarness();
    store.add();
    const firstRead = store.chronometers();

    store.add();

    expect(store.chronometers()[0].id).toBe(firstRead[0].id);
    expect(store.chronometers()).toHaveLength(2);
  });

  it('ignores add() once the shared timer has started', () => {
    const { store } = createHarness();
    store.add();
    store.start();

    store.add();

    expect(store.chronometers()).toHaveLength(1);
  });

  it('starts every entry from one shared clock reading and one timer source', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.add();
    harness.setNow(42_000);

    harness.store.start();

    expect(harness.clockCalls()).toBe(1);
    expect(harness.timerCalls()).toBe(1);
    expect(harness.store.started()).toBe(true);
    expect(harness.store.running()).toBe(true);
    expect(
      harness.store
        .chronometers()
        .every(({ status, startInstant }) => status === 'running' && startInstant === 42_000),
    ).toBe(true);
  });

  it('updates on timer emissions from clock time and tolerates missed-time jumps', () => {
    const harness = createHarness();
    harness.store.add();
    harness.setNow(10_000);
    harness.store.start();

    harness.setNow(11_000);
    harness.tick.next();
    expect(harness.store.chronometers()[0]?.formattedElapsed).toBe('00:01.000');

    harness.setNow(75_678);
    harness.tick.next();
    expect(harness.store.chronometers()[0]?.elapsedMilliseconds).toBe(65_678);
    expect(harness.store.chronometers()[0]?.formattedElapsed).toBe('01:05.678');
    expect(harness.clockCalls()).toBe(3);
  });

  it('clamps elapsed time when the clock moves before the shared start', () => {
    const harness = createHarness();
    harness.store.add();
    harness.setNow(1_000);
    harness.store.start();
    harness.setNow(500);
    harness.tick.next();

    expect(harness.store.chronometers()[0]?.formattedElapsed).toBe('00:00.000');
  });

  it('prevents duplicate starts and subscriptions', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.start();
    harness.setNow(5_000);

    harness.store.start();

    expect(harness.clockCalls()).toBe(1);
    expect(harness.timerCalls()).toBe(1);
    expect(harness.store.chronometers().every(({ startInstant }) => startInstant === 0)).toBe(true);
  });

  it('stops one entry at its click instant while the others continue running', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.add();
    harness.store.start();
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
    expect(harness.store.running()).toBe(true);

    harness.setNow(5_000);
    harness.tick.next();

    expect(harness.store.chronometers()[0]?.formattedElapsed).toBe('00:02.345');
    expect(harness.store.chronometers()[1]?.formattedElapsed).toBe('00:05.000');
  });

  it('reorders chronometers ascending by elapsed time after each stop click', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.add();
    harness.store.add();
    harness.store.start();

    // At this instant only chronometer-3 has stopped, so it goes first regardless of
    // the still-running entries' momentary elapsed time.
    harness.setNow(500);
    harness.store.stop('chronometer-3');
    expect(harness.store.chronometers().map(({ id }) => id)).toEqual([
      'chronometer-3',
      'chronometer-1',
      'chronometer-2',
    ]);

    // Stopping the slowest-so-far entry keeps it ordered last among stopped entries.
    harness.setNow(3_000);
    harness.store.stop('chronometer-1');
    expect(harness.store.chronometers().map(({ id }) => id)).toEqual([
      'chronometer-3',
      'chronometer-1',
      'chronometer-2',
    ]);

    // The still-running entry is evaluated at the click instant; it lands in the middle.
    harness.setNow(1_500);
    harness.store.stop('chronometer-2');
    expect(harness.store.chronometers().map(({ id }) => id)).toEqual([
      'chronometer-3',
      'chronometer-2',
      'chronometer-1',
    ]);
    expect(harness.store.chronometers().map(({ elapsedMilliseconds }) => elapsedMilliseconds)).toEqual([
      500, 1_500, 3_000,
    ]);
  });

  it('places stopped chronometers ahead of still-running ones regardless of elapsed time', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.add();
    harness.store.start();

    // chronometer-2 stops much later than chronometer-1 would have, yet it must lead
    // because it has already stopped while chronometer-1 is still running.
    harness.setNow(50);
    harness.store.stop('chronometer-2');

    expect(harness.store.chronometers().map(({ id, status }) => ({ id, status }))).toEqual([
      { id: 'chronometer-2', status: 'stopped' },
      { id: 'chronometer-1', status: 'running' },
    ]);
  });

  it('breaks elapsed-time ties among stopped entries by chronometer name ascending', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.add();
    harness.store.start();
    harness.setNow(1_000);

    harness.store.stop('chronometer-2');
    harness.store.stop('chronometer-1');

    expect(harness.store.chronometers().map(({ id }) => id)).toEqual([
      'chronometer-1',
      'chronometer-2',
    ]);
  });

  it('ignores unknown and repeated stop actions without reading the clock', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.stop('chronometer-1');
    expect(harness.clockCalls()).toBe(0);

    harness.store.start();
    harness.setNow(1_000);
    harness.store.stop('chronometer-1');
    const clockCallsAfterStop = harness.clockCalls();

    harness.store.stop('chronometer-1');
    harness.store.stop('unknown');

    expect(harness.clockCalls()).toBe(clockCallsAfterStop);
    expect(harness.store.chronometers()[0]?.stopInstant).toBe(1_000);
  });

  it('keeps Start consumed and tears down ticking after every entry stops', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.add();
    harness.store.start();
    expect(harness.tick.observed).toBe(true);

    harness.store.chronometers().forEach(({ id }, index) => {
      harness.setNow((index + 1) * 1_000);
      harness.store.stop(id);
    });

    expect(harness.store.started()).toBe(true);
    expect(harness.store.running()).toBe(false);
    expect(harness.tick.observed).toBe(false);

    const clockCallsAfterStops = harness.clockCalls();
    harness.store.start();

    expect(harness.clockCalls()).toBe(clockCallsAfterStops);
    expect(harness.timerCalls()).toBe(1);
    expect(harness.store.chronometers().every(({ status }) => status === 'stopped')).toBe(true);
  });

  it('does not start with an empty collection', () => {
    const harness = createHarness();

    harness.store.start();

    expect(harness.clockCalls()).toBe(0);
    expect(harness.timerCalls()).toBe(0);
  });

  it('reports allStopped only once started and every entry is stopped', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.add();
    expect(harness.store.allStopped()).toBe(false);

    harness.store.start();
    expect(harness.store.allStopped()).toBe(false);

    const ids = harness.store.chronometers().map(({ id }) => id);
    ids.slice(0, -1).forEach((id) => harness.store.stop(id));
    expect(harness.store.allStopped()).toBe(false);

    harness.store.stop(ids[ids.length - 1]);
    expect(harness.store.allStopped()).toBe(true);
  });

  it('ignores resume before Start and while any chronometer is still running', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.add();

    harness.store.resume();
    expect(harness.clockCalls()).toBe(0);
    expect(harness.timerCalls()).toBe(0);

    harness.store.start();
    harness.store.stop(harness.store.chronometers()[0].id);
    harness.store.resume();

    expect(harness.timerCalls()).toBe(1);
    expect(harness.store.chronometers()[0]?.status).toBe('stopped');
  });

  it('does not resume with an empty collection', () => {
    const harness = createHarness();

    harness.store.resume();

    expect(harness.clockCalls()).toBe(0);
    expect(harness.timerCalls()).toBe(0);
  });

  it('resumes every entry by continuing from its own frozen elapsed value', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.add();
    harness.store.add();
    harness.store.start();
    const ids = harness.store.chronometers().map(({ id }) => id);
    harness.setNow(1_000);
    harness.store.stop(ids[0]);
    harness.setNow(3_000);
    harness.store.stop(ids[1]);
    harness.setNow(5_000);
    harness.store.chronometers()
      .filter(({ status }) => status === 'running')
      .forEach(({ id }) => harness.store.stop(id));
    expect(harness.tick.observed).toBe(false);

    const clockCallsBeforeResume = harness.clockCalls();
    harness.setNow(50_000);
    harness.store.resume();

    expect(harness.clockCalls()).toBe(clockCallsBeforeResume + 1);
    expect(harness.timerCalls()).toBe(2);
    expect(harness.tick.observed).toBe(true);
    expect(harness.store.allStopped()).toBe(false);
    expect(
      harness.store.chronometers().every(({ status, stopInstant }) => status === 'running' && stopInstant === null),
    ).toBe(true);
    // Each entry continues from its own frozen elapsed value rather than resetting to zero.
    expect(harness.store.chronometers()[0]?.elapsedMilliseconds).toBe(1_000);
    expect(harness.store.chronometers()[1]?.elapsedMilliseconds).toBe(3_000);
    expect(harness.store.chronometers()[2]?.elapsedMilliseconds).toBe(5_000);

    harness.setNow(50_400);
    harness.tick.next();
    expect(harness.store.chronometers()[0]?.formattedElapsed).toBe('00:01.400');
    expect(harness.store.chronometers()[1]?.formattedElapsed).toBe('00:03.400');
  });

  it('supports repeated stop-then-resume cycles, continuing elapsed time each round', () => {
    const harness = createHarness();
    harness.store.add();
    harness.store.add();
    harness.store.start();
    harness.setNow(1_000);
    harness.store.chronometers().forEach(({ id }) => harness.store.stop(id));
    expect(harness.store.chronometers()[0]?.elapsedMilliseconds).toBe(1_000);

    harness.setNow(5_000);
    harness.store.resume();
    expect(harness.store.chronometers()[0]?.elapsedMilliseconds).toBe(1_000);

    harness.setNow(6_000);
    harness.store.chronometers().forEach(({ id }) => harness.store.stop(id));
    expect(harness.store.allStopped()).toBe(true);
    expect(harness.store.chronometers()[0]?.elapsedMilliseconds).toBe(2_000);

    harness.setNow(10_000);
    harness.store.resume();

    expect(harness.timerCalls()).toBe(3);
    expect(
      harness.store.chronometers().every(({ status }) => status === 'running'),
    ).toBe(true);
    expect(harness.store.chronometers()[0]?.elapsedMilliseconds).toBe(2_000);
  });

  it('creates an independent, empty collection for a fresh root injector lifetime', () => {
    const root = TestBed.inject(EnvironmentInjector);
    const firstLifetime = createEnvironmentInjector([ChronometerStore], root);
    const secondLifetime = createEnvironmentInjector([ChronometerStore], root);

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
