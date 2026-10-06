import { InjectionToken } from '@angular/core';
import type { FirebaseOptions } from 'firebase/app';
import { FIREBASE_CONFIG } from './firebase.config';

export const FIREBASE_OPTIONS = new InjectionToken<FirebaseOptions | null>('FIREBASE_OPTIONS', {
  providedIn: 'root',
  factory: () => FIREBASE_CONFIG,
});
