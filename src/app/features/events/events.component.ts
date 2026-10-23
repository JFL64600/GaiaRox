import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EVENT_NAME_MAX_LENGTH, EventStore } from '../../core/event.store';
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
  private readonly route = inject(ActivatedRoute);
  protected readonly readonly = this.route.snapshot.data['readonly'] === true;
  protected readonly base = this.readonly ? '/view' : '/admin';

  protected readonly nameMaxLength = EVENT_NAME_MAX_LENGTH;
  protected readonly creating = signal(false);
  protected readonly pendingName = signal('');
  protected readonly pendingResumeEnabled = signal(false);
  protected readonly canCreate = computed(() => this.pendingName().trim() !== '');
  protected readonly query = signal('');
  protected readonly filteredEvents = computed(() => {
    const q = this.query().trim().toLocaleLowerCase();
    return this.store.events().filter((event) => event.name.toLocaleLowerCase().includes(q));
  });

  protected startCreating(): void {
    this.pendingName.set('');
    this.pendingResumeEnabled.set(false);
    this.creating.set(true);
  }

  protected cancelCreating(): void {
    this.creating.set(false);
  }

  protected updateName(event: Event): void {
    this.pendingName.set((event.target as HTMLInputElement).value);
  }

  protected toggleResumeEnabled(): void {
    this.pendingResumeEnabled.update((enabled) => !enabled);
  }

  protected create(event?: Event): void {
    event?.preventDefault();
    const created = this.store.create(this.pendingName(), this.pendingResumeEnabled());
    if (created) {
      this.creating.set(false);
      void this.router.navigate([this.base, 'events', created.id]);
    }
  }

  protected updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected remove(id: string, name: string): void {
    if (globalThis.confirm?.(this.i18n.t('events.confirmDelete', { name })) ?? true) {
      this.store.remove(id);
    }
  }
}
