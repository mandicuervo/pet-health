import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { HealthEntry } from '../../../core/models/health-entry.model';
import { PetTracking } from '../../../core/models/pet.model';
import { PetData } from '../../../core/services/pet-data';
import { localDateKey } from '../../../core/utils/date';

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
  imports: [NgTemplateOutlet, RouterLink, TranslatePipe],
  selector: 'app-record-entry-page',
  styleUrl: './record-entry-page.scss',
  templateUrl: './record-entry-page.html',
})
export class RecordEntryPage {
  private readonly petData = inject(PetData);
  readonly pet = this.petData.pet;
  readonly foods = this.petData.foods;
  readonly activeTab = signal<RecordTab>('food');
  readonly errorKey = signal<string | undefined>(undefined);
  readonly successKey = signal<string | undefined>(undefined);
  readonly currentDate = localDateKey(new Date());
  readonly currentTime = new Date().toTimeString().slice(0, 5);
  readonly tabs = computed(() => {
    const tracking = this.pet().tracking;
    return RECORD_TABS.filter((tab) =>
      this.isTrackingEnabled(tab.id, tracking),
    );
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

  saveRecord(event: Event): void {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || !form.reportValidity()) {
      return;
    }

    const data = new FormData(form);
    try {
      switch (this.activeTab()) {
        case 'bloodGlucose':
          this.petData.saveHealthEntry({
            id: this.createId(),
            petId: this.pet().id,
            type: 'bloodGlucose',
            valueMgDl: Number(data.get('value')),
            measuredAt: this.datetime(data),
            notes: String(data.get('notes') ?? ''),
          });
          break;
        case 'insulin':
          this.petData.saveHealthEntry({
            id: this.createId(),
            petId: this.pet().id,
            type: 'insulin',
            doseUnits: Number(data.get('dose')),
            administeredAt: this.datetime(data),
            notes: String(data.get('notes') ?? ''),
          });
          break;
        case 'medication':
          this.saveMedication(data);
          break;
        case 'food':
          this.saveFoodRecord(data);
          break;
      }

      this.errorKey.set(undefined);
      this.successKey.set('records.saved');
      form.reset();
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      if (error.message === 'Health entry details are invalid') {
        this.errorKey.set('records.invalidEntry');
        return;
      }
      if (error.message === 'Meal entry details are invalid') {
        this.errorKey.set('records.invalidEntry');
        return;
      }
      throw error;
    }
  }

  private saveMedication(data: FormData): void {
    const doseUnit = String(data.get('doseUnit'));
    if (
      doseUnit !== 'mg' &&
      doseUnit !== 'ml' &&
      doseUnit !== 'tablet' &&
      doseUnit !== 'drop' &&
      doseUnit !== 'other'
    ) {
      throw new Error(`Unsupported medication dose unit: ${doseUnit}`);
    }

    const entry: HealthEntry = {
      id: this.createId(),
      petId: this.pet().id,
      type: 'medication',
      medicationName: String(data.get('medicationName')),
      doseAmount: Number(data.get('doseAmount')),
      doseUnit,
      administeredAt: this.datetime(data),
      notes: String(data.get('notes') ?? ''),
    };
    this.petData.saveHealthEntry(entry);
  }

  private saveFoodRecord(data: FormData): void {
    const foodId = String(data.get('foodId'));
    const food = this.foods().find((item) => item.id === foodId);
    if (!food) {
      throw new Error(`Food ${foodId} not found for meal record`);
    }

    this.petData.saveMealEvent({
      id: this.createId(),
      petId: this.pet().id,
      type: food.category === 'treat' ? 'treat' : 'meal',
      foodId: food.id,
      grams: Number(data.get('grams')),
      eatenAt: this.datetime(data),
    });
  }

  private datetime(data: FormData): string {
    return `${String(data.get('date'))}T${String(data.get('time'))}:00`;
  }

  private createId(): string {
    return `record-${globalThis.crypto.randomUUID()}`;
  }

  private isTrackingEnabled(
    tab: RecordTab,
    tracking: PetTracking[],
  ): boolean {
    if (tab === 'food') {
      return tracking.includes('food');
    }
    return tracking.includes(tab);
  }
}
