import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeId, ThemeService, THEMES } from './core/theme.service';
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

  protected readonly themeMenuOpen = signal(false);

  protected currentSwatch(): string {
    return THEMES.find(({ id }) => id === this.themeService.theme())?.swatch ?? 'transparent';
  }

  protected async copyLink(): Promise<void> {
    await navigator.clipboard?.writeText(globalThis.location.href);
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
