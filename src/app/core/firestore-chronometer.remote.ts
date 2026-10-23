import { inject, Injectable } from '@angular/core';
import type { Firestore } from 'firebase/firestore';
import { ChronometerSnapshot, parseSnapshot } from './chronometer.model';
import { ChronometerRemote, RemoteEvent } from './chronometer.tokens';
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
          doc(firestore, 'events', roomId),
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
        setDoc(
          doc(firestore, 'events', roomId),
          {
            chronometers: snapshot.chronometers,
            name: snapshot.name ?? null,
          },
          { merge: true },
        ),
      )
      .catch(onError);
  }

  setResumeEnabled(
    roomId: string,
    enabled: boolean,
    onError: (error: unknown) => void = () => undefined,
  ): void {
    Promise.all([this.getFirestore(), import('firebase/firestore')])
      .then(([firestore, { doc, setDoc }]) =>
        setDoc(doc(firestore, 'events', roomId), { resumeEnabled: enabled }, { merge: true }),
      )
      .catch(onError);
  }

  watchEvents(
    onChange: (events: readonly RemoteEvent[]) => void,
    onError: (error: unknown) => void = () => undefined,
  ): () => void {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    Promise.all([this.getFirestore(), import('firebase/firestore')])
      .then(([firestore, { collection, onSnapshot }]) => {
        if (cancelled) {
          return;
        }
        unsubscribe = onSnapshot(
          collection(firestore, 'events'),
          (snap) =>
            onChange(
              snap.docs.map((entry) => {
                const name: unknown = entry.data()['name'];
                return {
                  id: entry.id,
                  name: typeof name === 'string' && name.trim() !== '' ? name : entry.id,
                  resumeEnabled: entry.data()['resumeEnabled'] === true,
                };
              }),
            ),
          onError,
        );
      })
      .catch(onError);

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }

  remove(roomId: string, onError: (error: unknown) => void = () => undefined): void {
    Promise.all([this.getFirestore(), import('firebase/firestore')])
      .then(([firestore, { deleteDoc, doc }]) => deleteDoc(doc(firestore, 'events', roomId)))
      .catch(onError);
  }

  async measureClockOffset(): Promise<number> {
    const [firestore, { deleteDoc, doc, getDoc, serverTimestamp, setDoc }] = await Promise.all([
      this.getFirestore(),
      import('firebase/firestore'),
    ]);
    const ref = doc(firestore, 'clock', crypto.randomUUID());
    const before = Date.now();
    await setDoc(ref, { t: serverTimestamp() });
    const after = Date.now();
    const serverTime = (await getDoc(ref)).data()?.['t']?.toMillis?.();
    deleteDoc(ref).catch(() => undefined);
    return typeof serverTime === 'number' ? serverTime - (before + after) / 2 : 0;
  }
}
