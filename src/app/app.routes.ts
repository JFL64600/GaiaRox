import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'chronometers',
    loadComponent: () =>
      import('./features/chronometers/chronometers.component').then(
        ({ ChronometersComponent }) => ChronometersComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'chronometers' },
  { path: '**', redirectTo: 'chronometers' },
];
