import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  selector: 'app-bottom-navigation',
  styleUrl: './bottom-navigation.scss',
  templateUrl: './bottom-navigation.html',
})
export class BottomNavigation {
  readonly navigation = [
    { path: '/', key: 'navigation.home', icon: 'home' },
    { path: '/food-diary', key: 'navigation.history', icon: 'records' },
    { path: '/foods', key: 'navigation.food', icon: 'foods' },
    { path: '/weight', key: 'navigation.weight', icon: 'weight' },
    { path: '/profile', key: 'navigation.profile', icon: 'profile' },
  ];
}
