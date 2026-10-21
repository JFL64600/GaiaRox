import { ChangeDetectorRef, DestroyRef, inject, Pipe, PipeTransform } from '@angular/core';
import { ChronometerStore, formatElapsed } from './chronometer.store';
import { ChronometerView } from './chronometer.model';

/**
 * Formats a chronometer's elapsed time. While it runs, the value is refreshed on every
 * animation frame; otherwise it falls back to the frozen elapsed time.
 */
@Pipe({ name: 'liveElapsed', pure: false })
export class LiveElapsedPipe implements PipeTransform {
  private readonly store = inject(ChronometerStore);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private frameId: number | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  transform(chronometer: ChronometerView): string {
    if (chronometer.status !== 'running' || chronometer.startInstant === null) {
      this.stop();
      return chronometer.formattedElapsed;
    }
    this.schedule();
    return formatElapsed(this.store.instant() - chronometer.startInstant);
  }

  private schedule(): void {
    if (this.frameId !== null || typeof requestAnimationFrame === 'undefined') {
      return;
    }
    this.frameId = requestAnimationFrame(() => {
      this.frameId = null;
      this.changeDetector.markForCheck();
    });
  }

  private stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }
}
