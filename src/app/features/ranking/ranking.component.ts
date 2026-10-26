import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { ChronometerView } from '../../core/chronometer.model';
import { I18n } from '../../core/i18n.service';
import { RankingStyleService } from '../../core/ranking-style.service';

const MEDALS = ['🥇', '🥈', '🥉'] as const;
const FRESH_MS = 3000;

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
  protected readonly started = computed(() =>
    this.chronometers().length > 0,
  );
  protected readonly top = computed(() => this.entries().slice(0, 3));
  protected readonly rest = computed(() => this.entries().slice(3));
  /** Podium order: 2nd, 1st, 3rd. */
  protected readonly podium = computed(() => {
    const [first, second, third] = this.top();
    return [second, first, third].filter((entry) => entry !== undefined);
  });

  private readonly seen = new Set<string>();
  private initialized = false;
  private readonly freshIds = signal<ReadonlySet<string>>(new Set());

  constructor() {
    effect(() => {
      const loaded = this.chronometers().length > 0;
      const ids = this.entries().map(({ id }) => id);
      const added = ids.filter((id) => !this.seen.has(id));
      ids.forEach((id) => this.seen.add(id));
      if (!this.initialized) {
        this.initialized = loaded;
        return;
      }
      if (added.length === 0) {
        return;
      }
      untracked(() => this.freshIds.update((set) => new Set([...set, ...added])));
      setTimeout(
        () =>
          this.freshIds.update((set) => new Set([...set].filter((id) => !added.includes(id)))),
        FRESH_MS,
      );
    });
  }

  protected isFresh(id: string): boolean {
    return this.freshIds().has(id);
  }
}
