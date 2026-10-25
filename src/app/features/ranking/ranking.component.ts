import { Component, computed, inject, input } from '@angular/core';
import { ChronometerView } from '../../core/chronometer.model';
import { I18n } from '../../core/i18n.service';
import { RankingStyleService } from '../../core/ranking-style.service';

const MEDALS = ['🥇', '🥈', '🥉'] as const;

export interface RankedEntry {
  readonly id: string;
  readonly name: string;
  readonly letter: string;
  readonly time: string;
  readonly position: number;
  readonly medal: string | null;
}

/** Fastest finished chronometers first; running or never-started ones are not ranked. */
export function rank(chronometers: readonly ChronometerView[]): readonly RankedEntry[] {
  return chronometers
    .filter(({ status, startInstant }) => status === 'stopped' && startInstant !== null)
    .sort((a, b) => a.elapsedMilliseconds - b.elapsedMilliseconds)
    .map((entry, index) => ({
      id: entry.id,
      name: entry.name,
      letter: Array.from(entry.name.trim())[0]?.toLocaleUpperCase() ?? '?',
      time: entry.formattedElapsed,
      position: index + 1,
      medal: MEDALS[index] ?? null,
    }));
}

@Component({
  selector: 'app-ranking',
  styleUrl: './ranking.component.css',
  templateUrl: './ranking.component.html',
})
export class RankingComponent {
  readonly chronometers = input.required<readonly ChronometerView[]>();

  protected readonly i18n = inject(I18n);
  protected readonly layout = inject(RankingStyleService).layout;
  protected readonly entries = computed(() => rank([...this.chronometers()]));
  protected readonly top = computed(() => this.entries().slice(0, 3));
  protected readonly rest = computed(() => this.entries().slice(3));
  /** Podium order: 2nd, 1st, 3rd. */
  protected readonly podium = computed(() => {
    const [first, second, third] = this.top();
    return [second, first, third].filter((entry) => entry !== undefined);
  });
}
