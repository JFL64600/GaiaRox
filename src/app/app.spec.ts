import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';
import { ChronometerStore } from './core/chronometer.store';

describe('App', () => {
  beforeEach(async () => {
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
    expect(compiled.querySelectorAll('nav a')).toHaveLength(2);
  });

  it('preserves the root chronometer set across in-app navigation', async () => {
    const harness = await RouterTestingHarness.create('/chronometers');
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

    await harness.navigateByUrl('/about');
    await harness.navigateByUrl('/chronometers');

    const returnedIds = store.chronometers().map(({ id }) => id);
    const returnedRenderedIds = Array.from(
      harness.routeNativeElement?.querySelectorAll<HTMLElement>('.chronometer-card') ?? [],
      ({ id }) => id,
    );

    expect(returnedIds).toEqual(initialIds);
    expect(returnedRenderedIds).toEqual(initialRenderedIds);
  });
});

