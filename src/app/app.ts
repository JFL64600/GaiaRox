import { Component, HostListener, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeService, THEMES } from './core/theme.service';
import { I18n, LANGUAGE_LABELS, LANGUAGES } from './core/i18n.service';
import { CHRONOMETER_LOCAL_STORAGE_KEY } from './core/chronometer.store';

@Component({
  imports: [RouterLink, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly i18n = inject(I18n);
  protected readonly languages = LANGUAGES;
  protected readonly languageLabels = LANGUAGE_LABELS;
  protected readonly themeService = inject(ThemeService);
  protected readonly themes = THEMES;

  /** Ctrl+Shift+Z clears the saved chronometers and reloads the page. */
  @HostListener('document:keydown', ['$event'])
  protected clearLocalStorageShortcut(event: KeyboardEvent): void {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      globalThis.localStorage?.removeItem(CHRONOMETER_LOCAL_STORAGE_KEY);
      globalThis.location?.reload();
    }
  }
}
