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

  protected start(): void {
    this.store.start();
  }

  protected resume(): void {
    this.store.resume();
  }

  protected stop(id: string): void {
    this.store.stop(id);
  }
}
