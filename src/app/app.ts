import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavigation } from './core/components/bottom-navigation/bottom-navigation';
import { Theme } from './core/services/theme';

@Component({
  imports: [RouterOutlet, BottomNavigation],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('pet-health');
  private readonly theme = inject(Theme);
}
