import { Injectable, signal } from '@angular/core';
import { MessageKey } from './i18n.service';

export type ThemeId = 'forest' | 'basque' | 'ocean' | 'purple' | 'sunset' | 'dark';

export interface ThemeOption {
  readonly id: ThemeId;
  readonly labelKey: MessageKey;
  /** Colour shown on the picker swatch. */
  readonly swatch: string;
}

export const THEMES: readonly ThemeOption[] = [
  { id: 'forest', labelKey: 'theme.forest', swatch: '#10643b' },
  { id: 'basque', labelKey: 'theme.basque', swatch: '#c8102e' },
  { id: 'ocean', labelKey: 'theme.ocean', swatch: '#1769aa' },
  { id: 'purple', labelKey: 'theme.purple', swatch: '#6b46c1' },
  { id: 'sunset', labelKey: 'theme.sunset', swatch: '#c2410c' },
  { id: 'dark', labelKey: 'theme.dark', swatch: '#0f172a' },
];

export const DEFAULT_THEME: ThemeId = 'forest';
const THEME_STORAGE_KEY = 'gaiarox.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeId>(DEFAULT_THEME);

  constructor() {
    const stored = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
    const known = THEMES.find(({ id }) => id === stored);
    this.apply(known?.id ?? DEFAULT_THEME);
  }

  /** Changes the theme and remembers it on this device. */
  setTheme(theme: ThemeId): void {
    this.apply(theme);
    globalThis.localStorage?.setItem(THEME_STORAGE_KEY, theme);
  }

  private apply(theme: ThemeId): void {
    this.theme.set(theme);
    globalThis.document?.documentElement.setAttribute('data-theme', theme);
  }
}
