import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PetData } from '../../services/pet-data';

@Component({
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  selector: 'app-bottom-navigation',
  styleUrl: './bottom-navigation.scss',
  templateUrl: './bottom-navigation.html',
})
export class BottomNavigation {
  private readonly petData = inject(PetData);
  readonly navigation = computed(() => [
    { path: '/', key: 'navigation.nutrition', icon: 'nutrition' },
    ...(this.petData.pet().tracking.includes('weight')
      ? [{ path: '/weight', key: 'navigation.weight', icon: 'weight' }]
      : []),
    { path: '/foods', key: 'navigation.foods', icon: 'foods' },
    { path: '/profile', key: 'navigation.profile', icon: 'profile' },
  ]);
}
