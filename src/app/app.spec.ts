import { resetLocalStorage } from './core/testing-storage';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';
import { ChronometerStore } from './core/chronometer.store';
import { ChronometerSnapshot } from './core/chronometer.model';
import { CHRONOMETER_REMOTE, ChronometerRemote } from './core/chronometer.tokens';

describe('App', () => {
  beforeEach(async () => {
    resetLocalStorage();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the application navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain('GaiaRox');
    expect(compiled.querySelector('nav')).toBeNull();
  });

  it('restores an event chronometer set from the shared document after navigation', async () => {
    const saved = new Map<string, ChronometerSnapshot>();
    const remote: ChronometerRemote = {
      connect: (id, onSnapshot) => {
        onSnapshot(saved.get(id) ?? null);
        return () => undefined;
      },
      push: (id, snapshot) => void saved.set(id, snapshot),
    };
    TestBed.overrideProvider(CHRONOMETER_REMOTE, { useValue: remote });
    const harness = await RouterTestingHarness.create('/events/event-abc123');
    const store = TestBed.inject(ChronometerStore);
    store.add();
    store.add();
    harness.detectChanges();
    const initialIds = store.chronometers().map(({ id }) => id);
    const initialRenderedIds = Array.from(
      harness.routeNativeElement?.querySelectorAll<HTMLElement>('.chronometer-card') ?? [],
      ({ id }) => id,
    );

    expect(initialIds).toHaveLength(2);
    expect(initialRenderedIds).toEqual(initialIds);

    await harness.navigateByUrl('/events');
    await harness.navigateByUrl('/events/event-abc123');

    const returnedIds = store.chronometers().map(({ id }) => id);
    const returnedRenderedIds = Array.from(
      harness.routeNativeElement?.querySelectorAll<HTMLElement>('.chronometer-card') ?? [],
      ({ id }) => id,
    );

    expect(returnedIds).toEqual(initialIds);
    expect(returnedRenderedIds).toEqual(initialRenderedIds);
  });
});
