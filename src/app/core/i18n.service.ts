import { Injectable, signal } from '@angular/core';

export type Language = 'fr' | 'en' | 'eu';

/** Languages offered in the switcher; English texts are kept but hidden. */
export const LANGUAGES: readonly Language[] = ['eu', 'fr'];
export const LANGUAGE_LABELS: Record<Language, string> = { fr: 'FR', en: 'EN', eu: 'EUS' };
export const DEFAULT_LANGUAGE: Language = 'eu';
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
    'chronometer.name': "Nom de l'équipe",
    'chronometer.nameUsed': 'Ce nom est déjà utilisé.',
    'events.label': 'Événements',
    'events.empty': "Aucun événement pour l'instant.",
    'events.add': 'Créer un événement',
    'events.new': 'Nouvel événement',
    'events.name': "Nom de l'événement",
    'events.join': 'Rejoindre',
    'events.joinCode': "Code de l'événement",
    'events.open': 'Ouvrir {name}',
    'events.delete': 'Supprimer {name}',
    'events.confirmDelete': 'Supprimer l’événement « {name} » ?',
    'events.back': 'Retour aux événements',
    'events.code': 'Code :',
    'common.add': 'Ajouter',
    'common.cancel': 'Annuler',
    'sync.label': 'Synchronisation cloud',
    'sync.inRoom': 'Synchronisé dans la salle',
    'sync.copyLink': 'Copier le lien de partage',
    'sync.leave': 'Quitter la salle',
    'sync.error': 'Synchronisation impossible. Vérifiez la connexion.',
    'sync.roomCode': 'Code de salle',
    'sync.join': 'Rejoindre la salle',
    'sync.newCode': 'Nouveau code',
    'theme.label': 'Thème',
    'theme.forest': 'Forêt',
    'theme.basque': 'Basque',
    'theme.ocean': 'Océan',
    'theme.purple': 'Violet',
    'theme.sunset': 'Coucher de soleil',
    'theme.dark': 'Sombre',
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
    'chronometer.name': 'Team name',
    'chronometer.nameUsed': 'This name is already used.',
    'events.label': 'Events',
    'events.empty': 'No events yet.',
    'events.add': 'Create an event',
    'events.new': 'New event',
    'events.name': 'Event name',
    'events.join': 'Join',
    'events.joinCode': 'Event code',
    'events.open': 'Open {name}',
    'events.delete': 'Delete {name}',
    'events.confirmDelete': 'Delete event "{name}"?',
    'events.back': 'Back to events',
    'events.code': 'Code:',
    'common.add': 'Add',
    'common.cancel': 'Cancel',
    'sync.label': 'Cloud sync',
    'sync.inRoom': 'Synced in room',
    'sync.copyLink': 'Copy share link',
    'sync.leave': 'Leave room',
    'sync.error': 'Sync failed. Check your connection.',
    'sync.roomCode': 'Room code',
    'sync.join': 'Join room',
    'sync.newCode': 'New code',
    'theme.label': 'Theme',
    'theme.forest': 'Forest',
    'theme.basque': 'Basque',
    'theme.ocean': 'Ocean',
    'theme.purple': 'Purple',
    'theme.sunset': 'Sunset',
    'theme.dark': 'Dark',
  },
  eu: {
    'language.label': 'Hizkuntza',
    'chronometers.label': 'Kronometroak',
    'chronometer.defaultName': '{n}. kronometroa',
    'chronometer.elapsed': 'Igarotako denbora {time}',
    'chronometer.status': 'Egoera:',
    'chronometer.running': 'Martxan',
    'chronometer.stopped': 'Geldituta',
    'chronometer.start': 'Hasi',
    'chronometer.stop': 'Gelditu',
    'chronometer.resume': 'Berrekin',
    'chronometer.startNamed': 'Hasi {name}',
    'chronometer.stopNamed': 'Gelditu {name}',
    'chronometer.resumeNamed': 'Berrekin {name}',
    'chronometer.add': 'Gehitu kronometroa',
    'chronometer.new': 'Kronometro berria',
    'chronometer.name': 'Taldearen izena',
    'chronometer.nameUsed': 'Izen hau jada erabilita dago.',
    'events.label': 'Ekitaldiak',
    'events.empty': 'Oraindik ez dago ekitaldirik.',
    'events.add': 'Sortu ekitaldia',
    'events.new': 'Ekitaldi berria',
    'events.name': 'Ekitaldiaren izena',
    'events.join': 'Sartu',
    'events.joinCode': 'Ekitaldiaren kodea',
    'events.open': 'Ireki {name}',
    'events.delete': 'Ezabatu {name}',
    'events.confirmDelete': '"{name}" ekitaldia ezabatu?',
    'events.back': 'Itzuli ekitaldietara',
    'events.code': 'Kodea:',
    'common.add': 'Gehitu',
    'common.cancel': 'Utzi',
    'sync.label': 'Hodeiko sinkronizazioa',
    'sync.inRoom': 'Gelan sinkronizatuta',
    'sync.copyLink': 'Kopiatu partekatzeko esteka',
    'sync.leave': 'Irten gelatik',
    'sync.error': 'Ezin da sinkronizatu. Egiaztatu konexioa.',
    'sync.roomCode': 'Gelaren kodea',
    'sync.join': 'Sartu gelan',
    'sync.newCode': 'Kode berria',
    'theme.label': 'Gaia',
    'theme.forest': 'Basoa',
    'theme.basque': 'Euskal',
    'theme.ocean': 'Ozeanoa',
    'theme.purple': 'More',
    'theme.sunset': 'Ilunabarra',
    'theme.dark': 'Iluna',
  },
} as const satisfies Record<Language, Record<string, string>>;

export type MessageKey = keyof (typeof MESSAGES)['fr'];

@Injectable({ providedIn: 'root' })
export class I18n {
  readonly language = signal<Language>(DEFAULT_LANGUAGE);

  constructor() {
    const stored = globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY);
    const language = LANGUAGES.find((candidate) => candidate === stored);
    if (language) {
      this.language.set(language);
      this.syncDocument(language);
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
