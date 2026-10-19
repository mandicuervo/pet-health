import { Routes } from '@angular/router';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { FoodsPage } from './features/foods/foods-page/foods-page';
import { ProfilePage } from './features/profile/profile-page/profile-page';
import { SectionPage } from './features/section-page/section-page';

export const routes: Routes = [
  { path: '', component: DashboardPage },
  {
    path: 'weight',
    component: SectionPage,
    data: {
      titleKey: 'navigation.weight',
      descriptionKey: 'pages.weightDescription',
    },
  },
  {
    path: 'foods',
    component: FoodsPage,
  },
  {
    path: 'profile',
    component: ProfilePage,
  },
  { path: '**', redirectTo: '' },
];
