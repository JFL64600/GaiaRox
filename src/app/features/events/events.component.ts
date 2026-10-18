import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EVENT_ID_PATTERN, EVENT_NAME_MAX_LENGTH, EventStore } from '../../core/event.store';
import { I18n } from '../../core/i18n.service';

@Component({
  selector: 'app-events',
  imports: [RouterLink],
  styleUrl: './events.component.css',
  templateUrl: './events.component.html',
})
export class EventsComponent {
  protected readonly store = inject(EventStore);
  protected readonly i18n = inject(I18n);
  private readonly router = inject(Router);

  protected readonly nameMaxLength = EVENT_NAME_MAX_LENGTH;
  protected readonly creating = signal(false);
  protected readonly pendingName = signal('');
  protected readonly canCreate = computed(() => this.pendingName().trim() !== '');
  protected readonly joinCode = signal('');
  protected readonly canJoin = computed(() => EVENT_ID_PATTERN.test(this.joinCode().trim()));

  protected startCreating(): void {
    this.pendingName.set('');
    this.creating.set(true);
  }

  protected cancelCreating(): void {
    this.creating.set(false);
  }

  protected updateName(event: Event): void {
    this.pendingName.set((event.target as HTMLInputElement).value);
  }

  protected create(event?: Event): void {
    event?.preventDefault();
    const created = this.store.create(this.pendingName());
    if (created) {
      this.creating.set(false);
      void this.router.navigate(['/events', created.id]);
    }
  }

  protected updateJoinCode(event: Event): void {
    this.joinCode.set((event.target as HTMLInputElement).value);
  }

  protected join(event?: Event): void {
    event?.preventDefault();
    const joined = this.store.join(this.joinCode());
    if (joined) {
      this.joinCode.set('');
      void this.router.navigate(['/events', joined.id]);
    }
  }

  protected remove(id: string, name: string): void {
    if (globalThis.confirm?.(this.i18n.t('events.confirmDelete', { name })) ?? true) {
      this.store.remove(id);
    }
  }
}
