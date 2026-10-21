import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { resetLocalStorage } from '../../core/testing-storage';
import { EventStore } from '../../core/event.store';
import { I18n } from '../../core/i18n.service';
import { routes } from '../../app.routes';

describe('EventsComponent', () => {
  let harness: RouterTestingHarness;
  let store: EventStore;

  beforeEach(async () => {
    resetLocalStorage();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    TestBed.inject(I18n).language.set('en');
    store = TestBed.inject(EventStore);
    harness = await RouterTestingHarness.create('/admin/events');
  });

  const el = (): HTMLElement => harness.routeNativeElement as HTMLElement;

  it('lists events and creates one with the button', async () => {
    expect(el().querySelectorAll('.event-item')).toHaveLength(0);
    el().querySelector<HTMLButtonElement>('.create-button')!.click();
    harness.detectChanges();
    const input = el().querySelector<HTMLInputElement>('#event-name')!;
    input.value = 'Rally';
    input.dispatchEvent(new Event('input'));
    el().querySelector<HTMLFormElement>('.create-form')!.requestSubmit();
    await harness.fixture.whenStable();

    expect(store.events().map(({ name }) => name)).toEqual(['Rally']);
  });

  it('joins an event by code and rejects invalid codes', () => {
    expect(store.join('x')).toBeNull();
    expect(store.join('abc123')?.id).toBe('abc123');
    expect(store.events()).toHaveLength(0);
  });

  it('deletes a single event', () => {
    vi.stubGlobal('confirm', () => true);
    store.create('A');
    const b = store.create('B')!;
    harness.detectChanges();

    el().querySelectorAll<HTMLButtonElement>('.delete-button')[0].click();
    harness.detectChanges();

    expect(store.events().map(({ id }) => id)).toEqual([b.id]);
    expect(el().querySelectorAll('.event-item')).toHaveLength(1);
  });
});
