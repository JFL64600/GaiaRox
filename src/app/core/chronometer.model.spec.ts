import { parseSnapshot } from './chronometer.model';

describe('parseSnapshot', () => {
  const entry = {
    id: 'chronometer-1',
    displayNumber: 1,
    name: 'A',
    status: 'stopped',
    startInstant: null,
    stopInstant: null,
  };

  it('accepts a valid snapshot', () => {
    expect(parseSnapshot({ entries: [entry], nextId: 2, sharedStart: null })).toEqual({
      entries: [entry],
      nextId: 2,
      sharedStart: null,
    });
  });

  it('rejects malformed snapshots', () => {
    expect(parseSnapshot(null)).toBeNull();
    expect(parseSnapshot({ entries: [1], nextId: 2, sharedStart: null })).toBeNull();
    expect(parseSnapshot({ entries: [], nextId: 2 })).toBeNull();
    expect(
      parseSnapshot({ entries: [{ ...entry, status: 'x' }], nextId: 2, sharedStart: 1 }),
    ).toBeNull();
  });
});
