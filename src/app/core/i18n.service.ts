import { Injectable, signal } from '@angular/core';

export type Language = 'fr' | 'en';

export const LANGUAGES: readonly Language[] = ['fr', 'en'];
export const DEFAULT_LANGUAGE: Language = 'fr';
const LANGUAGE_STORAGE_KEY = 'gaiarox.language';

const MESSAGES = {
  fr: {
    'language.label': 'Langue',
    'chronometers.label': 'Chronomètres',
    'chronometer.defaultName': 'Chronomètre {n}',
    'chronometer.elapsed': 'Temps écoulé {time}',
    'chronometer.status': 'Statut :',
    'chronometer.running': 'En cours',
    'chronometer.stopped': 'Arrêté',
    'chronometer.start': 'Démarrer',
    'chronometer.stop': 'Arrêter',
    'chronometer.resume': 'Reprendre',
    'chronometer.startNamed': 'Démarrer {name}',
    'chronometer.stopNamed': 'Arrêter {name}',
    'chronometer.resumeNamed': 'Reprendre {name}',
    'chronometer.add': 'Ajouter un chronomètre',
    'chronometer.new': 'Nouveau chronomètre',
    'chronometer.name': 'Nom du chronomètre',
    'chronometer.nameUsed': 'Ce nom est déjà utilisé.',
    'common.add': 'Ajouter',
    'common.cancel': 'Annuler',
    'sync.label': 'Synchronisation cloud',
    'sync.inRoom': 'Synchronisé dans la salle',
    'sync.copyLink': 'Copier le lien de partage',
    'sync.leave': 'Quitter la salle',
    'sync.roomCode': 'Code de salle',
    'sync.join': 'Rejoindre la salle',
    'sync.newCode': 'Nouveau code',
  },
  en: {
    'language.label': 'Language',
    'chronometers.label': 'Chronometers',
    'chronometer.defaultName': 'Chronometer {n}',
    'chronometer.elapsed': 'Elapsed time {time}',
    'chronometer.status': 'Status:',
    'chronometer.running': 'Running',
    'chronometer.stopped': 'Stopped',
    'chronometer.start': 'Start',
    'chronometer.stop': 'Stop',
    'chronometer.resume': 'Resume',
    'chronometer.startNamed': 'Start {name}',
    'chronometer.stopNamed': 'Stop {name}',
    'chronometer.resumeNamed': 'Resume {name}',
    'chronometer.add': 'Add chronometer',
    'chronometer.new': 'New chronometer',
    'chronometer.name': 'Chronometer name',
    'chronometer.nameUsed': 'This name is already used.',
    'common.add': 'Add',
    'common.cancel': 'Cancel',
    'sync.label': 'Cloud sync',
    'sync.inRoom': 'Synced in room',
    'sync.copyLink': 'Copy share link',
    'sync.leave': 'Leave room',
    'sync.roomCode': 'Room code',
    'sync.join': 'Join room',
    'sync.newCode': 'New code',
  },
} as const satisfies Record<Language, Record<string, string>>;

export type MessageKey = keyof (typeof MESSAGES)['fr'];

@Injectable({ providedIn: 'root' })
export class I18n {
  readonly language = signal<Language>(DEFAULT_LANGUAGE);

  constructor() {
    const stored = globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'fr' || stored === 'en') {
      this.language.set(stored);
      this.syncDocument(stored);
    } else {
      this.syncDocument(DEFAULT_LANGUAGE);
    }
  }

  /** Reads the active language signal, so templates re-render when it changes. */
  t(key: MessageKey, params: Record<string, string | number> = {}): string {
    return MESSAGES[this.language()][key].replace(/\{(\w+)\}/g, (_, name: string) =>
      String(params[name] ?? ''),
    );
  }

  /** Changes the language and remembers it on this device. */
  setLanguage(language: Language): void {
    this.language.set(language);
    globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, language);
    this.syncDocument(language);
  }

  private syncDocument(language: Language): void {
    if (globalThis.document) {
      globalThis.document.documentElement.lang = language;
    }
  }
}
