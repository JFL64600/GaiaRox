import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { CHRONOMETER_REMOTE } from './core/chronometer.tokens';
import { FIREBASE_CONFIG } from './core/firebase.config';
import { FirestoreChronometerRemote } from './core/firestore-chronometer.remote';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    ...(FIREBASE_CONFIG
      ? [{ provide: CHRONOMETER_REMOTE, useExisting: FirestoreChronometerRemote }]
      : []),
  ],
};
