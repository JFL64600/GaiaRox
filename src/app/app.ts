import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeService, THEMES } from './core/theme.service';
import { I18n, LANGUAGE_LABELS, LANGUAGES } from './core/i18n.service';

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
}
