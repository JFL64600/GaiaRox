import { inject, Injectable } from '@angular/core';
import type { Firestore } from 'firebase/firestore';
import { ChronometerSnapshot, parseSnapshot } from './chronometer.model';
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
    onError: (error: unknown) => void = () => undefined,
  ): () => void {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    Promise.all([this.getFirestore(), import('firebase/firestore')])
      .then(([firestore, { doc, onSnapshot }]) => {
        if (cancelled) {
          return;
        }
        unsubscribe = onSnapshot(
          doc(firestore, 'rooms', roomId),
          (snap) => {
            if (snap.metadata.hasPendingWrites) {
              return;
            }
            if (!snap.exists()) {
              onSnapshotChange(null);
              return;
            }
            const parsed = parseSnapshot(snap.data());
            if (parsed) {
              onSnapshotChange(parsed);
            } else {
              onError(new Error('Invalid room data'));
            }
          },
          onError,
        );
      })
      .catch(onError);

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }

  push(
    roomId: string,
    snapshot: ChronometerSnapshot,
    onError: (error: unknown) => void = () => undefined,
  ): void {
    Promise.all([this.getFirestore(), import('firebase/firestore')])
      .then(([firestore, { doc, setDoc }]) =>
        setDoc(doc(firestore, 'rooms', roomId), {
          entries: snapshot.entries,
          nextId: snapshot.nextId,
          sharedStart: snapshot.sharedStart,
          startedAtGmt: snapshot.startedAtGmt,
        }),
      )
      .catch(onError);
  }

  async measureClockOffset(): Promise<number> {
    const [firestore, { doc, getDoc, serverTimestamp, setDoc }] = await Promise.all([
      this.getFirestore(),
      import('firebase/firestore'),
    ]);
    const ref = doc(firestore, 'clock', crypto.randomUUID());
    const before = Date.now();
    await setDoc(ref, { t: serverTimestamp() });
    const after = Date.now();
    const serverTime = (await getDoc(ref)).data()?.['t']?.toMillis?.();
    return typeof serverTime === 'number' ? serverTime - (before + after) / 2 : 0;
  }
}
