import { describe, expect, it } from 'vitest';
import { ChronometerView } from '../../core/chronometer.model';
import { rank } from './ranking.component';

function view(
  name: string,
  elapsed: number,
  status: 'stopped' | 'running' = 'stopped',
  started = true,
): ChronometerView {
  return {
    id: name,
    name,
    status,
    startInstant: started ? 0 : null,
    stopInstant: null,
    elapsedMilliseconds: elapsed,
    formattedElapsed: String(elapsed),
  };
}

describe('rank', () => {
  it('orders finished chronometers by fastest time and awards medals', () => {
    const ranked = rank([view('b', 20), view('a', 10), view('c', 30), view('d', 40)]);

    expect(ranked.map(({ name }) => name)).toEqual(['a', 'b', 'c', 'd']);
    expect(ranked.map(({ medal }) => medal)).toEqual(['🥇', '🥈', '🥉', null]);
  });

  it('ignores running and never-started chronometers', () => {
    const ranked = rank([
      view('run', 5, 'running'),
      view('idle', 0, 'stopped', false),
      view('x', 9),
    ]);

    expect(ranked.map(({ name }) => name)).toEqual(['x']);
  });

  it('uses the uppercased first letter as badge', () => {
    expect(rank([view('éric', 1)])[0].letter).toBe('É');
  });
});
