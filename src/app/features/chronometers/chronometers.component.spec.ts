import { resetLocalStorage } from '../../core/testing-storage';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { EventStore } from '../../core/event.store';
import { Subject } from 'rxjs';
import { I18n } from '../../core/i18n.service';
import { ChronometerStore } from '../../core/chronometer.store';
import { CHRONOMETER_CLOCK, CHRONOMETER_TIMER } from '../../core/chronometer.tokens';
import { ChronometersComponent } from './chronometers.component';

describe('ChronometersComponent', () => {
  let fixture: ComponentFixture<ChronometersComponent>;
  let store: ChronometerStore;
  let tick: Subject<void>;
  let now: number;

  async function configure(resumeEnabled?: boolean): Promise<void> {
    resetLocalStorage();
    now = 0;
    tick = new Subject<void>();
    const route = { snapshot: { data: {}, paramMap: convertToParamMap({}) } };

    await TestBed.configureTestingModule({
      imports: [ChronometersComponent],
      providers: [
        { provide: CHRONOMETER_CLOCK, useValue: () => now },
        { provide: CHRONOMETER_TIMER, useValue: () => tick },
        { provide: ActivatedRoute, useValue: route },
      ],
    }).compileComponents();

    TestBed.inject(I18n).language.set('en');
    store = TestBed.inject(ChronometerStore);
    if (resumeEnabled !== undefined) {
      const event = TestBed.inject(EventStore).create('Rally', resumeEnabled);
      route.snapshot.paramMap = convertToParamMap({ id: event!.id });
    }
    fixture = TestBed.createComponent(ChronometersComponent);
    await fixture.whenStable();
  }

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function cardButtons(position: number): HTMLButtonElement[] {
    return Array.from(
      element().querySelectorAll<HTMLButtonElement>(`.card-actions button:nth-child(${position})`),
    );
  }

  function startButtons(): HTMLButtonElement[] {
    return cardButtons(1);
  }

  function stopButtons(): HTMLButtonElement[] {
    return cardButtons(2);
  }

  function resumeButtons(): HTMLButtonElement[] {
    return cardButtons(3);
  }

  function times(): (string | undefined)[] {
    return Array.from(element().querySelectorAll('.time'), (time) => time.textContent?.trim());
  }

  function statuses(): (string | null)[] {
    return Array.from(element().querySelectorAll('.chronometer-card'), (card) =>
      card.classList.contains('running') ? 'Running' : 'Stopped',
    );
  }

  function addButton(): HTMLButtonElement | null {
    return element().querySelector<HTMLButtonElement>('.add-tile');
  }

  function nameForm(): HTMLFormElement | null {
    return element().querySelector<HTMLFormElement>('.name-form');
  }

  function nameInput(): HTMLInputElement | null {
    return element().querySelector<HTMLInputElement>('#chronometer-name');
  }

  function confirmButton(): HTMLButtonElement | null {
    return element().querySelector<HTMLButtonElement>('.name-actions button[type="submit"]');
  }

  function cancelButton(): HTMLButtonElement | null {
    return element().querySelector<HTMLButtonElement>('.name-actions .secondary');
  }

  async function typeName(value: string): Promise<void> {
    const input = nameInput()!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function addNamedChronometer(name: string): Promise<void> {
    addButton()?.click();
    await fixture.whenStable();
    await typeName(name);
    nameForm()?.requestSubmit();
    await fixture.whenStable();
  }

  async function addChronometers(count: number): Promise<void> {
    for (let index = 0; index < count; index += 1) {
      await addNamedChronometer(`Racer ${store.chronometers().length + 1}`);
    }
  }

  afterEach(() => TestBed.resetTestingModule());

  it('requests a name before adding a chronometer', async () => {
    await configure();

    addButton()?.click();
    await fixture.whenStable();

    expect(addButton()).toBeNull();
    expect(nameForm()).toBeInstanceOf(HTMLFormElement);
    expect(nameInput()?.value).toBe('');
    expect(nameInput()?.getAttribute('maxlength')).toBe('40');
    expect(document.activeElement).toBe(nameInput());
    expect(confirmButton()?.disabled).toBe(true);
    expect(store.chronometers()).toHaveLength(0);

    await typeName('  Xabi  ');
    expect(confirmButton()?.disabled).toBe(false);
    nameForm()?.requestSubmit();
    await fixture.whenStable();

    expect(store.chronometers().map(({ name }) => name)).toEqual(['Xabi']);
    expect(element().querySelector('.chronometer-card h2')?.textContent?.trim()).toBe('Xabi');
    expect(stopButtons()[0]?.getAttribute('aria-label')).toBe('Stop Xabi');
    expect(nameForm()).toBeNull();
    expect(addButton()).toBeInstanceOf(HTMLButtonElement);
  });

  it('does not add a chronometer for a blank name', async () => {
    await configure();
    addButton()?.click();
    await fixture.whenStable();

    await typeName('   ');
    expect(confirmButton()?.disabled).toBe(true);
    nameForm()?.requestSubmit();
    await fixture.whenStable();

    expect(store.chronometers()).toHaveLength(0);
    expect(nameForm()).toBeInstanceOf(HTMLFormElement);
  });

  it('rejects a name already used by another chronometer, ignoring case', async () => {
    await configure();
    await addNamedChronometer('Xabi');

    addButton()?.click();
    await fixture.whenStable();
    await typeName(' xABI ');

    expect(confirmButton()?.disabled).toBe(true);
    expect(element().querySelector('.name-error')?.textContent?.trim()).toBe(
      'This name is already used.',
    );
    expect(nameInput()?.getAttribute('aria-invalid')).toBe('true');

    nameForm()?.requestSubmit();
    await fixture.whenStable();
    expect(store.chronometers()).toHaveLength(1);
  });

  it('cancels the name request with the Cancel button or Escape key', async () => {
    await configure();

    addButton()?.click();
    await fixture.whenStable();
    await typeName('Xabi');
    cancelButton()?.click();
    await fixture.whenStable();

    expect(nameForm()).toBeNull();
    expect(addButton()).toBeInstanceOf(HTMLButtonElement);
    expect(store.chronometers()).toHaveLength(0);

    addButton()?.click();
    await fixture.whenStable();
    expect(nameInput()?.value).toBe('');
    nameInput()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(nameForm()).toBeNull();
    expect(store.chronometers()).toHaveLength(0);
  });

  it('renders only the Add tile when no chronometer has been added yet', async () => {
    await configure();

    expect(element().querySelectorAll('.chronometer-card')).toHaveLength(0);
    expect(addButton()).toBeInstanceOf(HTMLButtonElement);
    expect(addButton()?.getAttribute('aria-label')).toBe('Add chronometer');
  });

  it('appends one stopped chronometer card and keeps the Add tile beside it on every click', async () => {
    await configure();

    await addChronometers(1);
    expect(element().querySelectorAll('.chronometer-card')).toHaveLength(1);
    expect(addButton()).toBeInstanceOf(HTMLButtonElement);
    expect(startButtons()[0]?.disabled).toBe(false);

    await addChronometers(1);
    expect(element().querySelectorAll('.chronometer-card')).toHaveLength(2);
    expect(addButton()).toBeInstanceOf(HTMLButtonElement);

    const cards = element().querySelectorAll<HTMLElement>('.chronometer-card');
    expect(Array.from(cards, ({ id }) => id)).toEqual(store.chronometers().map(({ id }) => id));
    expect(statuses()).toEqual(['Stopped', 'Stopped']);
    expect(stopButtons()).toHaveLength(2);
    expect(stopButtons().every(({ disabled }) => disabled)).toBe(true);
  });

  it('places the Add tile as the first grid item', async () => {
    await configure();

    await addChronometers(5);

    const gridItems = Array.from(element().querySelectorAll('.chronometer-grid > li'));
    expect(gridItems).toHaveLength(6);
    expect(gridItems[0].querySelector('.add-tile')).toBeInstanceOf(HTMLButtonElement);
    expect(
      gridItems.slice(1).every((item) => item.querySelector('.chronometer-card') !== null),
    ).toBe(true);
  });

  it('starts a single chronometer with its own Start button and records the GMT date', async () => {
    await configure();
    await addChronometers(2);
    now = 5_000;

    startButtons()[0]?.click();
    await fixture.whenStable();

    expect(statuses()).toEqual(['Running', 'Stopped']);
    expect(startButtons()[0]?.disabled).toBe(true);
    expect(startButtons()[1]?.disabled).toBe(false);
    expect(stopButtons()[0]?.disabled).toBe(false);
  });

  it('updates every running time after a controlled one-second signal advance', async () => {
    await configure();
    await addChronometers(5);
    startButtons().forEach((button) => button.click());
    await fixture.whenStable();

    now = 1_000;
    tick.next();
    await fixture.whenStable();

    expect(times()).toEqual(Array(5).fill('00:01.000'));
  });

  it('stops only the selected chronometer and freezes its rendered value', async () => {
    await configure();
    await addChronometers(5);
    startButtons().forEach((button) => button.click());
    await fixture.whenStable();
    now = 1_250;

    stopButtons()[0]?.click();
    await fixture.whenStable();

    expect(stopButtons()[0]?.disabled).toBe(true);
    expect(
      stopButtons()
        .slice(1)
        .every(({ disabled }) => !disabled),
    ).toBe(true);
    expect(statuses()).toEqual(['Stopped', 'Running', 'Running', 'Running', 'Running']);

    now = 2_000;
    tick.next();
    await fixture.whenStable();

    expect(times()).toEqual(['00:01.250', '00:02.000', '00:02.000', '00:02.000', '00:02.000']);
  });

  it('hides the resume button unless the event enables it', async () => {
    await configure(false);
    await addChronometers(1);
    startButtons().forEach((button) => button.click());
    await fixture.whenStable();
    stopButtons()[0]?.click();
    await fixture.whenStable();

    expect(resumeButtons()).toHaveLength(0);
  });

  it('resumes a stopped chronometer from its own frozen elapsed value', async () => {
    await configure(true);
    await addChronometers(2);
    startButtons().forEach((button) => button.click());
    await fixture.whenStable();

    now = 1_250;
    stopButtons()[0]?.click();
    await fixture.whenStable();
    expect(resumeButtons()[0]?.disabled).toBe(false);
    expect(resumeButtons()[1]?.disabled).toBe(true);

    now = 9_000;
    resumeButtons()[0]?.click();
    await fixture.whenStable();
    expect(statuses()).toEqual(['Running', 'Running']);

    now = 9_400;
    tick.next();
    await fixture.whenStable();

    expect(times()).toEqual(['00:01.650', '00:09.400']);
  });
});
