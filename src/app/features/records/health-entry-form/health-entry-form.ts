import { Component, inject, input, signal, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { HealthEntry } from '../../../core/models/health-entry.model';
import { PetData } from '../../../core/services/pet-data';
import { localDateKey } from '../../../core/utils/date';

type HealthEntryType = HealthEntry['type'];

@Component({
  imports: [TranslatePipe],
  selector: 'app-health-entry-form',
  styleUrl: './health-entry-form.scss',
  templateUrl: './health-entry-form.html',
})
export class HealthEntryForm {
  private readonly petData = inject(PetData);

  readonly entryType = input.required<HealthEntryType>();
  readonly saved = output<void>();
  readonly errorKey = signal<string | undefined>(undefined);
  readonly currentDate = localDateKey(new Date());
  readonly currentTime = new Date().toTimeString().slice(0, 5);

  save(event: Event): void {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || !form.reportValidity()) {
      return;
    }

    const data = new FormData(form);
    const datetime = `${String(data.get('date'))}T${String(data.get('time'))}:00`;
    const notes = String(data.get('notes') ?? '').trim();
    const base = {
      id: `record-${globalThis.crypto.randomUUID()}`,
      petId: this.petData.pet().id,
      notes,
    };

    let entry: HealthEntry;
    switch (this.entryType()) {
      case 'bloodGlucose':
        entry = {
          ...base,
          type: 'bloodGlucose',
          valueMgDl: Number(data.get('value')),
          measuredAt: datetime,
        };
        break;
      case 'insulin':
        entry = {
          ...base,
          type: 'insulin',
          doseUnits: Number(data.get('dose')),
          administeredAt: datetime,
        };
        break;
      case 'medication': {
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
        entry = {
          ...base,
          type: 'medication',
          medicationName: String(data.get('medicationName')),
          doseAmount: Number(data.get('doseAmount')),
          doseUnit,
          administeredAt: datetime,
        };
        break;
      }
    }

    try {
      this.petData.saveHealthEntry(entry);
      this.errorKey.set(undefined);
      this.saved.emit();
      form.reset();
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      if (error.message !== 'Health entry details are invalid') {
        throw error;
      }
      this.errorKey.set('records.invalidEntry');
    }
  }
}
