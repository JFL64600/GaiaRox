import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'chronometers',
    loadComponent: () =>
      import('./features/chronometers/chronometers.component').then(
        ({ ChronometersComponent }) => ChronometersComponent,
      ),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./features/about/about.component').then(
        ({ AboutComponent }) => AboutComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'chronometers' },
  { path: '**', redirectTo: 'chronometers' },
];
