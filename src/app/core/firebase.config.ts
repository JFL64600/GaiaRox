import type { FirebaseOptions } from 'firebase/app';

/**
 * Public Firebase web config enabling cross-device sync. Leave `null` to keep chronometers local.
 * See README "Cloud sync" for setup.
 */
export const FIREBASE_CONFIG: FirebaseOptions | null = {
  apiKey: 'AIzaSyB37I-ZUyK8THH1DNjl4hhKU6iYQdhLqaA',
  authDomain: 'gaiarox-app.firebaseapp.com',
  projectId: 'gaiarox-app',
  storageBucket: 'gaiarox-app.firebasestorage.app',
  messagingSenderId: '383694244190',
  appId: '1:383694244190:web:cc7d52458481a92b6d27cf',
};
