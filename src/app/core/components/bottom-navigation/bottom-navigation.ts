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
    { path: '/', key: 'navigation.nutrition', icon: 'nutrition' },
    { path: '/weight', key: 'navigation.weight', icon: 'weight' },
    { path: '/foods', key: 'navigation.foods', icon: 'foods' },
    { path: '/profile', key: 'navigation.profile', icon: 'profile' },
  ];
}
