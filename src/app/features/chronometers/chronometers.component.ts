import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { ChronometerStore } from '../../core/chronometer.store';
import { FIREBASE_OPTIONS } from '../../core/firebase.token';

const ROOM_STORAGE_KEY = 'gaiarox.room';
const ROOM_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

export const CHRONOMETER_NAME_MAX_LENGTH = 40;

@Component({
  selector: 'app-chronometers',
  styleUrl: './chronometers.component.css',
  templateUrl: './chronometers.component.html',
})
export class ChronometersComponent {
  protected readonly store = inject(ChronometerStore);
  private readonly injector = inject(Injector);
  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  protected readonly syncAvailable = inject(FIREBASE_OPTIONS) !== null;
  protected readonly roomInput = signal('');
  protected readonly roomValid = computed(() => ROOM_PATTERN.test(this.roomInput().trim()));
  protected readonly nameMaxLength = CHRONOMETER_NAME_MAX_LENGTH;
  protected readonly naming = signal(false);
  protected readonly pendingName = signal('');
  protected readonly trimmedName = computed(() => this.pendingName().trim());
  protected readonly duplicateName = computed(() => {
    const candidate = this.trimmedName().toLocaleLowerCase();
    return (
      candidate !== '' &&
      this.store.chronometers().some(({ name }) => name.toLocaleLowerCase() === candidate)
    );
  });
  protected readonly canConfirmName = computed(
    () => this.trimmedName() !== '' && !this.duplicateName(),
  );

  constructor() {
    if (!this.syncAvailable) {
      return;
    }

    const fromUrl = new URLSearchParams(globalThis.location?.search).get('room');
    const room = fromUrl ?? globalThis.localStorage?.getItem(ROOM_STORAGE_KEY);
    if (room && ROOM_PATTERN.test(room)) {
      this.roomInput.set(room);
      this.joinRoom();
    }
  }

  protected updateRoom(event: Event): void {
    this.roomInput.set((event.target as HTMLInputElement).value);
  }

  protected generateRoom(): void {
    this.roomInput.set(crypto.randomUUID().replaceAll('-', '').slice(0, 12));
  }

  protected joinRoom(): void {
    if (!this.roomValid()) {
      return;
    }

    const room = this.roomInput().trim();
    globalThis.localStorage?.setItem(ROOM_STORAGE_KEY, room);
    this.store.joinRoom(room);
  }

  protected leaveRoom(): void {
    globalThis.localStorage?.removeItem(ROOM_STORAGE_KEY);
    this.store.leaveRoom();
  }

  protected async copyLink(): Promise<void> {
    const url = new URL(globalThis.location.href);
    url.searchParams.set('room', this.store.currentRoom() ?? '');
    await navigator.clipboard?.writeText(url.toString());
  }

  protected requestName(): void {
    this.pendingName.set('');
    this.naming.set(true);
    afterNextRender(() => this.nameInput()?.nativeElement.focus(), { injector: this.injector });
  }

  protected updateName(event: Event): void {
    this.pendingName.set((event.target as HTMLInputElement).value);
  }

  protected confirmName(event?: Event): void {
    event?.preventDefault();
    if (!this.canConfirmName()) {
      return;
    }

    this.store.add(this.trimmedName());
    this.cancelName();
  }

  protected cancelName(): void {
    this.naming.set(false);
    this.pendingName.set('');
  }
  protected stop(id: string): void {
    this.store.stop(id);
  }
}
