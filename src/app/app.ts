import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { ThemeId, ThemeService, THEMES } from './core/theme.service';
import { RANKING_STYLES, RankingStyleService } from './core/ranking-style.service';
import { ChronometerStore } from './core/chronometer.store';
import { I18n, LANGUAGE_LABELS, LANGUAGES } from './core/i18n.service';

@Component({
  imports: [RouterLink, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly i18n = inject(I18n);
  protected readonly chronometerStore = inject(ChronometerStore);
  protected readonly languages = LANGUAGES;
  protected readonly languageLabels = LANGUAGE_LABELS;
  protected readonly themeService = inject(ThemeService);
  protected readonly themes = THEMES;
  protected readonly rankingService = inject(RankingStyleService);
  protected readonly rankingStyles = RANKING_STYLES;

  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  protected readonly home = computed(() => (this.url().startsWith('/admin') ? '/admin' : '/view'));
  protected readonly showRankingPicker = computed(
    () => !this.rankingService.mobile() && /^\/view\/events\/[^/?#]+/.test(this.url()),
  );

  protected readonly themeMenuOpen = signal(false);

  protected currentSwatch(): string {
    return THEMES.find(({ id }) => id === this.themeService.theme())?.swatch ?? 'transparent';
  }

  protected async copyLink(): Promise<void> {
    const url = new URL(globalThis.location.href);
    url.pathname = url.pathname.replace(/^\/admin(?=\/|$)/, '/view');
    await navigator.clipboard?.writeText(url.toString());
  }

  protected chooseTheme(theme: ThemeId): void {
    this.themeService.setTheme(theme);
    this.themeMenuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected closeThemeMenu(event: Event): void {
    if (!(event.target instanceof Element) || !event.target.closest('.theme-switch')) {
      this.themeMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected closeThemeMenuOnEscape(): void {
    this.themeMenuOpen.set(false);
  }
}
