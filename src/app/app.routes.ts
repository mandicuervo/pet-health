import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { PetData } from './core/services/pet-data';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { FoodDiaryPage } from './features/food-diary/food-diary-page/food-diary-page';
import { FoodsPage } from './features/foods/foods-page/foods-page';
import { PetCustomizationPage } from './features/pet-customization/pet-customization-page/pet-customization-page';
import { ProfilePage } from './features/profile/profile-page/profile-page';
import { RecordEntryPage } from './features/records/record-entry-page/record-entry-page';
import { WeightPage } from './features/weight/weight-page/weight-page';

const requireSetup: CanActivateFn = () => {
  const setupComplete = inject(PetData).setupComplete();
  return setupComplete || inject(Router).parseUrl('/setup');
};

const requireFirstSetup: CanActivateFn = () => {
  const setupComplete = inject(PetData).setupComplete();
  return setupComplete ? inject(Router).parseUrl('/') : true;
};

const requireWeightTracking: CanActivateFn = () =>
  inject(PetData).pet().tracking.includes('weight') ||
  inject(Router).parseUrl('/');

export const routes: Routes = [
  { path: '', component: DashboardPage, canActivate: [requireSetup] },
  { path: 'setup', component: PetCustomizationPage, canActivate: [requireFirstSetup], data: { firstSetup: true } },
  { path: 'weight', component: WeightPage, canActivate: [requireSetup, requireWeightTracking] },
  { path: 'records/new', component: RecordEntryPage, canActivate: [requireSetup] },
  { path: 'food-diary', component: FoodDiaryPage, canActivate: [requireSetup] },
  {
    path: 'foods',
    component: FoodsPage,
    canActivate: [requireSetup],
  },
  {
    path: 'profile',
    component: ProfilePage,
    canActivate: [requireSetup],
  },
  { path: 'profile/customization', component: PetCustomizationPage, canActivate: [requireSetup] },
  { path: '**', redirectTo: '' },
];
