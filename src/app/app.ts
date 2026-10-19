import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavigation } from './core/components/bottom-navigation/bottom-navigation';

@Component({
  imports: [RouterOutlet, BottomNavigation],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('pet-health');
}
