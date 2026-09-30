import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ChronometerStore } from '../../core/chronometer.store';
import { CHRONOMETER_CLOCK, CHRONOMETER_TIMER } from '../../core/chronometer.tokens';
import { ChronometersComponent } from './chronometers.component';

describe('ChronometersComponent', () => {
  let fixture: ComponentFixture<ChronometersComponent>;
  let store: ChronometerStore;
  let tick: Subject<void>;
  let now: number;

  async function configure(): Promise<void> {
    now = 0;
    tick = new Subject<void>();

    await TestBed.configureTestingModule({
      imports: [ChronometersComponent],
      providers: [
        { provide: CHRONOMETER_CLOCK, useValue: () => now },
        { provide: CHRONOMETER_TIMER, useValue: () => tick },
      ],
    }).compileComponents();

    store = TestBed.inject(ChronometerStore);
    fixture = TestBed.createComponent(ChronometersComponent);
    await fixture.whenStable();
  }

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function startButton(): HTMLButtonElement | null {
    return element().querySelectorAll<HTMLButtonElement>('.heading button')[0] ?? null;
  }

  function resumeButton(): HTMLButtonElement | null {
    return element().querySelectorAll<HTMLButtonElement>('.heading button')[1] ?? null;
  }

  function stopButtons(): HTMLButtonElement[] {
    return Array.from(element().querySelectorAll<HTMLButtonElement>('.stop-button'));
  }

  function addButton(): HTMLButtonElement | null {
    return element().querySelector<HTMLButtonElement>('.add-tile');
  }

  async function addChronometers(count: number): Promise<void> {
    for (let index = 0; index < count; index += 1) {
      addButton()?.click();
      await fixture.whenStable();
    }
  }

  afterEach(() => TestBed.resetTestingModule());

  it('renders only the Add tile when no chronometer has been added yet', async () => {
    await configure();

    expect(element().querySelectorAll('.chronometer-card')).toHaveLength(0);
    expect(addButton()).toBeInstanceOf(HTMLButtonElement);
    expect(addButton()?.getAttribute('aria-label')).toBe('Add chronometer');
    expect(startButton()?.disabled).toBe(true);
  });

  it('appends one stopped chronometer card and keeps the Add tile beside it on every click', async () => {
    await configure();

    await addChronometers(1);
    expect(element().querySelectorAll('.chronometer-card')).toHaveLength(1);
    expect(addButton()).toBeInstanceOf(HTMLButtonElement);
    expect(startButton()?.disabled).toBe(false);

    await addChronometers(1);
    expect(element().querySelectorAll('.chronometer-card')).toHaveLength(2);
    expect(addButton()).toBeInstanceOf(HTMLButtonElement);

    const cards = element().querySelectorAll<HTMLElement>('.chronometer-card');
    expect(Array.from(cards, ({ id }) => id)).toEqual(store.chronometers().map(({ id }) => id));
    expect(
      Array.from(element().querySelectorAll('.status strong'), (status) => status.textContent),
    ).toEqual(['Stopped', 'Stopped']);
    expect(stopButtons()).toHaveLength(2);
    expect(stopButtons().every(({ disabled }) => disabled)).toBe(true);
  });

  it('places the Add tile as the last grid item so it wraps every 4 chronometers', async () => {
    await configure();

    await addChronometers(5);

    const gridItems = Array.from(element().querySelectorAll('.chronometer-grid > li'));
    expect(gridItems).toHaveLength(6);
    expect(gridItems[5].querySelector('.add-tile')).toBeInstanceOf(HTMLButtonElement);
    expect(
      gridItems.slice(0, 5).every((item) => item.querySelector('.chronometer-card') !== null),
    ).toBe(true);
  });

  it('removes the Add tile once Start has fired', async () => {
    await configure();
    await addChronometers(2);
    expect(addButton()).toBeInstanceOf(HTMLButtonElement);

    startButton()?.click();
    await fixture.whenStable();

    expect(addButton()).toBeNull();
    expect(element().querySelectorAll('.chronometer-card')).toHaveLength(2);
  });

  it('uses one clearly named native Start button that starts the shared store action', async () => {
    await configure();
    await addChronometers(5);
    const start = startButton();
    const startSpy = vi.spyOn(store, 'start');

    expect(start).toBeInstanceOf(HTMLButtonElement);
    expect(start?.type).toBe('button');
    expect(start?.textContent?.trim()).toBe('Start');
    expect(start?.disabled).toBe(false);

    start?.click();
    await fixture.whenStable();

    expect(startSpy).toHaveBeenCalledOnce();
    expect(start?.disabled).toBe(true);
    expect(store.chronometers().every(({ status }) => status === 'running')).toBe(true);
    expect(new Set(store.chronometers().map(({ startInstant }) => startInstant))).toEqual(
      new Set([0]),
    );
    expect(
      Array.from(element().querySelectorAll('.status strong'), (status) => status.textContent),
    ).toEqual(Array(5).fill('Running'));
    expect(stopButtons().every(({ disabled }) => !disabled)).toBe(true);
  });

  it('updates every rendered time after a controlled one-second signal advance', async () => {
    await configure();
    await addChronometers(5);
    startButton()?.click();
    await fixture.whenStable();

    now = 1_000;
    tick.next();
    await fixture.whenStable();

    expect(Array.from(element().querySelectorAll('.time'), (time) => time.textContent?.trim())).toEqual(
      Array(5).fill('00:01.000'),
    );
  });

  it('stops only the selected chronometer and freezes its rendered value', async () => {
    await configure();
    await addChronometers(5);
    startButton()?.click();
    await fixture.whenStable();
    now = 1_250;

    stopButtons()[0]?.click();
    await fixture.whenStable();

    expect(stopButtons()[0]?.disabled).toBe(true);
    expect(stopButtons().slice(1).every(({ disabled }) => !disabled)).toBe(true);
    expect(
      Array.from(element().querySelectorAll('.status strong'), (status) => status.textContent),
    ).toEqual(['Stopped', 'Running', 'Running', 'Running', 'Running']);

    now = 2_000;
    tick.next();
    await fixture.whenStable();

    expect(Array.from(element().querySelectorAll('.time'), (time) => time.textContent?.trim())).toEqual(
      ['00:01.250', '00:02.000', '00:02.000', '00:02.000', '00:02.000'],
    );

    stopButtons()
      .slice(1)
      .forEach((button) => button.click());
    await fixture.whenStable();

    expect(startButton()?.disabled).toBe(true);
    expect(stopButtons().every(({ disabled }) => disabled)).toBe(true);
  });

  it('keeps Resume disabled until Start has fired and every chronometer is stopped', async () => {
    await configure();
    await addChronometers(5);

    expect(resumeButton()?.textContent?.trim()).toBe('Resume');
    expect(resumeButton()?.disabled).toBe(true);

    startButton()?.click();
    await fixture.whenStable();
    expect(resumeButton()?.disabled).toBe(true);

    stopButtons().slice(0, -1).forEach((button) => button.click());
    await fixture.whenStable();
    expect(resumeButton()?.disabled).toBe(true);

    stopButtons()[stopButtons().length - 1]?.click();
    await fixture.whenStable();
    expect(resumeButton()?.disabled).toBe(false);
  });

  it('resumes each chronometer by continuing from its own frozen elapsed value', async () => {
    await configure();
    await addChronometers(5);
    startButton()?.click();
    await fixture.whenStable();

    now = 1_250;
    stopButtons()[0]?.click();
    await fixture.whenStable();
    now = 3_000;
    stopButtons().slice(1).forEach((button) => button.click());
    await fixture.whenStable();

    now = 9_000;
    resumeButton()?.click();
    await fixture.whenStable();

    expect(Array.from(element().querySelectorAll('.time'), (time) => time.textContent?.trim())).toEqual(
      ['00:01.250', '00:03.000', '00:03.000', '00:03.000', '00:03.000'],
    );
    expect(
      Array.from(element().querySelectorAll('.status strong'), (status) => status.textContent),
    ).toEqual(Array(5).fill('Running'));
    expect(resumeButton()?.disabled).toBe(true);
    expect(stopButtons().every(({ disabled }) => !disabled)).toBe(true);

    now = 9_400;
    tick.next();
    await fixture.whenStable();

    expect(Array.from(element().querySelectorAll('.time'), (time) => time.textContent?.trim())).toEqual(
      ['00:01.650', '00:03.400', '00:03.400', '00:03.400', '00:03.400'],
    );
  });
});
