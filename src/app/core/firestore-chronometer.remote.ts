import { inject, Injectable } from '@angular/core';
import type { Firestore } from 'firebase/firestore';
import { ChronometerSnapshot } from './chronometer.model';
import { ChronometerRemote } from './chronometer.tokens';
import { FIREBASE_OPTIONS } from './firebase.token';

/** Firebase is loaded lazily so it stays out of the initial bundle. */
@Injectable({ providedIn: 'root' })
export class FirestoreChronometerRemote implements ChronometerRemote {
  private readonly options = inject(FIREBASE_OPTIONS);
  private firestore: Promise<Firestore> | null = null;

  private getFirestore(): Promise<Firestore> {
    this.firestore ??= (async () => {
      const [{ getApps, initializeApp }, { getFirestore }] = await Promise.all([
        import('firebase/app'),
        import('firebase/firestore'),
      ]);
      return getFirestore(getApps()[0] ?? initializeApp(this.options!));
    })();
    return this.firestore;
  }

  connect(
    roomId: string,
    onSnapshotChange: (snapshot: ChronometerSnapshot | null) => void,
  ): () => void {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    void Promise.all([this.getFirestore(), import('firebase/firestore')]).then(
      ([firestore, { doc, onSnapshot }]) => {
        if (cancelled) {
          return;
        }
        unsubscribe = onSnapshot(doc(firestore, 'rooms', roomId), (snap) => {
          if (snap.metadata.hasPendingWrites) {
            return;
          }
          onSnapshotChange(snap.exists() ? (snap.data() as ChronometerSnapshot) : null);
        });
      },
    );

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }

  push(roomId: string, snapshot: ChronometerSnapshot): void {
    void Promise.all([this.getFirestore(), import('firebase/firestore')]).then(
      ([firestore, { doc, setDoc }]) =>
        setDoc(doc(firestore, 'rooms', roomId), {
          entries: snapshot.entries,
          nextId: snapshot.nextId,
          sharedStart: snapshot.sharedStart,
        }),
    );
  }
}
