import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { BottomNavigation } from './core/components/bottom-navigation/bottom-navigation';
import { PetData } from './core/services/pet-data';
import { Theme } from './core/services/theme';
import { filter, map } from 'rxjs';

@Component({
  imports: [RouterOutlet, BottomNavigation],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('pet-health');
  private readonly router = inject(Router);
  readonly setupComplete = inject(PetData).setupComplete;
  readonly authPage = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => this.isAuthRoute(event.urlAfterRedirects)),
    ),
    { initialValue: this.isAuthRoute(this.router.url) },
  );
  private readonly theme = inject(Theme);

  private isAuthRoute(url: string): boolean {
    return ['/welcome', '/login', '/register'].includes(url.split('?')[0]);
  }
}
