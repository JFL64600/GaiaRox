import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventStore } from '../../core/event.store';
import { ChronometerStore } from '../../core/chronometer.store';
import { I18n } from '../../core/i18n.service';
import { FIREBASE_OPTIONS } from '../../core/firebase.token';
import { LiveElapsedPipe } from '../../core/live-elapsed.pipe';
import { RankingComponent } from '../ranking/ranking.component';

const ROOM_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

export const CHRONOMETER_NAME_MAX_LENGTH = 40;
const LEAVE_MS = 600;

@Component({
  selector: 'app-chronometers',
  imports: [LiveElapsedPipe, RankingComponent],
  styleUrl: './chronometers.component.css',
  templateUrl: './chronometers.component.html',
})
export class ChronometersComponent {
  protected readonly store = inject(ChronometerStore);
  protected readonly i18n = inject(I18n);
  private readonly injector = inject(Injector);
  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  protected eventId: string | null = null;
  private readonly events = inject(EventStore);
  protected readonly readonly =
    inject(ActivatedRoute, { optional: true })?.snapshot.data['readonly'] === true;
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
    effect(() => this.trackFinished());
    const eventId = inject(ActivatedRoute, { optional: true })?.snapshot.paramMap.get('id') ?? null;
    if (eventId !== null) {
      this.eventId = eventId;
      const event = this.events.find(eventId) ?? this.events.join(eventId);
      this.store.openEvent(event && event.name !== eventId ? event.name : null);
      if (this.syncAvailable) {
        this.store.joinRoom(eventId);
      }
      inject(DestroyRef).onDestroy(() => this.store.openEvent());
      return;
    }

    if (!this.syncAvailable) {
      return;
    }

    const fromUrl = new URLSearchParams(globalThis.location?.search).get('room');
    const room = fromUrl;
    if (room && ROOM_PATTERN.test(room)) {
      this.roomInput.set(room);
      this.joinRoom();
    }
  }

  protected updateRoom(event: Event): void {
    this.roomInput.set((event.target as HTMLInputElement).value);
  }

  protected generateRoom(): void {
    this.roomInput.set(crypto.randomUUID());
  }

  protected joinRoom(): void {
    if (!this.roomValid()) {
      return;
    }

    const room = this.roomInput().trim();
    this.store.joinRoom(room);
  }

  protected leaveRoom(): void {
    this.store.leaveRoom();
  }

  protected async copyLink(): Promise<void> {
    const url = new URL(globalThis.location.href);
    url.pathname = url.pathname.replace(/^\/admin(?=\/|$)/, '/view');
    if (this.eventId === null) {
      url.searchParams.set('room', this.store.currentRoom() ?? '');
    }
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

  protected readonly leaving = signal<ReadonlySet<string>>(new Set());
  private visibleIds = new Set<string>();

  protected readonly started = computed(() =>
    this.store.chronometers().length > 0,
  );
  protected readonly visibleChronometers = computed(() =>
    this.eventId && this.readonly
      ? this.store
          .chronometers()
          .filter(
            ({ id, status, startInstant }) =>
              !(status === 'stopped' && startInstant !== null) || this.leaving().has(id),
          )
      : this.store.chronometers(),
  );

  private trackFinished(): void {
    if (!this.eventId || !this.readonly) {
      return;
    }
    const current = this.store.chronometers();
    const nowVisible = new Set<string>();
    const finished: string[] = [];
    for (const { id, status, startInstant } of current) {
      if (status === 'stopped' && startInstant !== null) {
        if (this.visibleIds.has(id)) {
          finished.push(id);
        }
      } else {
        nowVisible.add(id);
      }
    }
    this.visibleIds = nowVisible;
    if (finished.length === 0) {
      return;
    }
    untracked(() => this.leaving.update((set) => new Set([...set, ...finished])));
    setTimeout(
      () =>
        this.leaving.update((set) => new Set([...set].filter((id) => !finished.includes(id)))),
      LEAVE_MS,
    );
  }

  protected showResume(): boolean {
    return this.eventId !== null && this.events.find(this.eventId)?.resumeEnabled === true;
  }
}
