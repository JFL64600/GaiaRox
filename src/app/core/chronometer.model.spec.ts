import { parseSnapshot } from './chronometer.model';

describe('parseSnapshot', () => {
  const entry = {
    id: 'chronometer-1',
    name: 'A',
    status: 'stopped',
    startInstant: null,
    stopInstant: null,
  };

  it('accepts a valid snapshot', () => {
    expect(parseSnapshot({ chronometers: [entry], })).toEqual({
      chronometers: [entry],
      name: null,
    });
  });

  it('keeps the shared event name', () => {
    expect(
      parseSnapshot({ chronometers: [], name: 'Race' })?.name,
    ).toBe('Race');
  });

  it('rejects malformed snapshots', () => {
    expect(parseSnapshot(null)).toBeNull();
    expect(parseSnapshot({ chronometers: [1] })).toBeNull();
    expect(
      parseSnapshot({ chronometers: [{ ...entry, status: 'x' }] }),
    ).toBeNull();
  });
});
