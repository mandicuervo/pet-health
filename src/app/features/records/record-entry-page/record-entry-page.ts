import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PetTracking } from '../../../core/models/pet.model';
import { PetData } from '../../../core/services/pet-data';
import { FoodForm } from '../../foods/food-form/food-form';
import { HealthEntryForm } from '../health-entry-form/health-entry-form';

type RecordTab = 'bloodGlucose' | 'insulin' | 'medication' | 'food';

interface RecordTabOption {
  id: RecordTab;
  labelKey: string;
}

const RECORD_TABS: RecordTabOption[] = [
  { id: 'bloodGlucose', labelKey: 'records.bloodGlucose' },
  { id: 'insulin', labelKey: 'records.insulin' },
  { id: 'medication', labelKey: 'records.medication' },
  { id: 'food', labelKey: 'records.food' },
];

@Component({
  imports: [FoodForm, HealthEntryForm, RouterLink, TranslatePipe],
  selector: 'app-record-entry-page',
  styleUrl: './record-entry-page.scss',
  templateUrl: './record-entry-page.html',
})
export class RecordEntryPage {
  private readonly petData = inject(PetData);
  readonly pet = this.petData.pet;
  readonly activeTab = signal<RecordTab>('food');
  readonly errorKey = signal<string | undefined>(undefined);
  readonly successKey = signal<string | undefined>(undefined);
  readonly healthEntryType = computed(() => {
    const activeTab = this.activeTab();
    return activeTab === 'food' ? 'bloodGlucose' : activeTab;
  });
  readonly tabs = computed(() => {
    const tracking = this.pet().tracking;
    return RECORD_TABS.filter((tab) => this.isTrackingEnabled(tab.id, tracking));
  });

  constructor() {
    this.activeTab.set(this.tabs()[0]?.id ?? 'food');
  }

  selectTab(tab: RecordTab): void {
    if (!this.tabs().some((option) => option.id === tab)) {
      throw new Error(`Record type ${tab} is not enabled for this pet`);
    }
    this.activeTab.set(tab);
    this.errorKey.set(undefined);
    this.successKey.set(undefined);
  }

  onFoodSaved(): void {
    this.errorKey.set(undefined);
    this.successKey.set('records.foodSaved');
  }

  onHealthEntrySaved(): void {
    this.errorKey.set(undefined);
    this.successKey.set('records.saved');
  }

  private isTrackingEnabled(tab: RecordTab, tracking: PetTracking[]): boolean {
    if (tab === 'food') {
      return tracking.includes('food');
    }
    return tracking.includes(tab);
  }
}
