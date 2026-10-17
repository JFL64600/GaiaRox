import { TestBed } from '@angular/core/testing';
import { I18n } from './i18n.service';

describe('I18n', () => {
  it('defaults to Basque and updates the document language', () => {
    const i18n = TestBed.inject(I18n);
    expect(i18n.language()).toBe('eu');
    expect(i18n.t('chronometer.start')).toBe('Hasi');
    expect(document.documentElement.lang).toBe('eu');
  });

  it('switches to English, interpolates parameters', () => {
    const i18n = TestBed.inject(I18n);
    i18n.setLanguage('en');
    expect(i18n.t('chronometer.startNamed', { name: 'Xabi' })).toBe('Start Xabi');
    expect(document.documentElement.lang).toBe('en');
  });
});
