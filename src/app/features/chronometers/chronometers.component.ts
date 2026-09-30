import { Component, inject } from '@angular/core';
import { ChronometerStore } from '../../core/chronometer.store';

@Component({
  selector: 'app-chronometers',
  styleUrl: './chronometers.component.css',
  templateUrl: './chronometers.component.html',
})
export class ChronometersComponent {
  protected readonly store = inject(ChronometerStore);

  protected add(): void {
    this.store.add();
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
