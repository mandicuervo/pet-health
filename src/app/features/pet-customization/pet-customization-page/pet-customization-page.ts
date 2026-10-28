import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import {
  PetCondition,
  PetProfileMode,
  PetTracking,
} from '../../../core/models/pet.model';
import { PetData } from '../../../core/services/pet-data';
import { localDateKey } from '../../../core/utils/date';

type CustomizationMode = PetProfileMode;

@Component({
  imports: [RouterLink, TranslatePipe],
  selector: 'app-pet-customization-page',
  styleUrl: './pet-customization-page.scss',
  templateUrl: './pet-customization-page.html',
})
export class PetCustomizationPage {
  private readonly petData = inject(PetData);
  private readonly router = inject(Router);
  readonly pet = this.petData.pet;
  readonly firstSetup = inject(ActivatedRoute).snapshot.data['firstSetup'] === true;
  readonly selectedModes = signal<Set<CustomizationMode>>(new Set());
  readonly errorKey = signal<string | undefined>(undefined);
  readonly currentDate = localDateKey(new Date());

  constructor() {
    if (this.firstSetup) {
      return;
    }

    const pet = this.pet();
    const modes = new Set<CustomizationMode>(pet.profileModes ?? []);
    if (pet.profileModes) {
      this.selectedModes.set(modes);
      return;
    }

    const hasDiabetes = pet.conditions.includes('diabetes');
    if (pet.conditions.includes('diabetes')) {
      modes.add('diabetes');
    }
    if (pet.conditions.includes('obesity')) {
      modes.add('obesity');
    }
    if (
      pet.conditions.length === 0 &&
      (pet.tracking.includes('food') || pet.tracking.includes('medication'))
    ) {
      modes.add('journal');
    } else if (
      !hasDiabetes &&
      pet.conditions.includes('obesity') &&
      pet.tracking.includes('medication')
    ) {
      modes.add('journal');
    }
    this.selectedModes.set(modes);
  }

  toggleMode(mode: CustomizationMode): void {
    this.selectedModes.update((selected) => {
      const updated = new Set(selected);
      if (updated.has(mode)) {
        updated.delete(mode);
      } else {
        updated.add(mode);
      }
      return updated;
    });
    this.errorKey.set(undefined);
  }

  saveCustomization(event: Event): void {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || !form.reportValidity()) {
      return;
    }

    const selected = this.selectedModes();
    if (selected.size === 0) {
      this.errorKey.set('customization.selectAtLeastOne');
      return;
    }

    const conditions: PetCondition[] = [];
    const tracking = new Set<PetTracking>();
    if (selected.has('diabetes')) {
      conditions.push('diabetes');
      tracking.add('bloodGlucose');
      tracking.add('insulin');
      tracking.add('medication');
      tracking.add('food');
    }
    if (selected.has('obesity')) {
      conditions.push('obesity');
      tracking.add('weight');
      tracking.add('food');
    }
    if (selected.has('journal')) {
      tracking.add('food');
      tracking.add('medication');
    }

    const data = new FormData(form);
    const speciesValue = data.get('species');
    let species = this.pet().species;
    if (this.firstSetup) {
      if (speciesValue !== 'cat' && speciesValue !== 'dog') {
        throw new Error(`Unsupported pet species: ${speciesValue}`);
      }
      species = speciesValue;
    }
    try {
      this.petData.savePet({
        ...this.pet(),
        ...(this.firstSetup
          ? {
              name: String(data.get('name')),
              species,
              birthDate: String(data.get('birthDate')),
            }
          : {}),
        conditions,
        tracking: [...tracking],
        profileModes: [...selected],
      });
      if (this.firstSetup) {
        this.petData.completeSetup();
        void this.router.navigateByUrl('/');
      } else {
        void this.router.navigateByUrl('/profile');
      }
    } catch (error) {
      if (
        !(error instanceof Error) ||
        error.message !== 'Pet profile details are invalid'
      ) {
        throw error;
      }
      this.errorKey.set('customization.saveError');
    }
  }
}
