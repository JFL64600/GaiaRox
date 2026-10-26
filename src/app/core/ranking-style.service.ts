import { computed, Injectable, signal } from '@angular/core';
import { MessageKey } from './i18n.service';

export type RankingStyleId = 'podium' | 'hero' | 'medals';
export type RankingLayout = RankingStyleId | 'list';

export interface RankingStyleOption {
  readonly id: RankingStyleId;
  readonly labelKey: MessageKey;
}

export const RANKING_STYLES: readonly RankingStyleOption[] = [
  { id: 'podium', labelKey: 'ranking.podium' },
  { id: 'hero', labelKey: 'ranking.hero' },
  { id: 'medals', labelKey: 'ranking.medals' },
];

const DEFAULT_RANKING_STYLE: RankingStyleId = 'podium';
const RANKING_STYLE_STORAGE_KEY = 'gaiarox.rankingStyle';
const MOBILE_QUERY = '(max-width: 34rem)';

@Injectable({ providedIn: 'root' })
export class RankingStyleService {
  readonly style = signal<RankingStyleId>(DEFAULT_RANKING_STYLE);
  readonly mobile = signal(false);
  /** Mobile screens always use the compact list, whatever style was chosen. */
  readonly layout = computed<RankingLayout>(() => (this.mobile() ? 'list' : this.style()));

  constructor() {
    const stored = globalThis.localStorage?.getItem(RANKING_STYLE_STORAGE_KEY);
    this.style.set(RANKING_STYLES.find(({ id }) => id === stored)?.id ?? DEFAULT_RANKING_STYLE);

    const query = globalThis.matchMedia?.(MOBILE_QUERY);
    if (query) {
      this.mobile.set(query.matches);
      query.addEventListener('change', (event) => this.mobile.set(event.matches));
    }
  }

  /** Changes the ranking style and remembers it on this device. */
  setStyle(style: RankingStyleId): void {
    this.style.set(style);
    globalThis.localStorage?.setItem(RANKING_STYLE_STORAGE_KEY, style);
  }
}
