import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'events',
    loadComponent: () =>
      import('./features/events/events.component').then(({ EventsComponent }) => EventsComponent),
  },
  {
    path: 'events/:id',
    loadComponent: () =>
      import('./features/chronometers/chronometers.component').then(
        ({ ChronometersComponent }) => ChronometersComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'events' },
  { path: '**', redirectTo: 'events' },
];
