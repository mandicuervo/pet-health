import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '../../../core/components/page-header/page-header';
import { PetApi } from '../../../core/services/pet-api';
import { PetCondition, PetProfileMode, PetTracking } from '../../../core/models/pet.model';
import { PetData } from '../../../core/services/pet-data';
import { localDateKey } from '../../../core/utils/date';

type CustomizationMode = PetProfileMode;

@Component({
  imports: [PageHeader, RouterLink, TranslatePipe],
  selector: 'app-pet-customization-page',
  styleUrl: './pet-customization-page.scss',
  templateUrl: './pet-customization-page.html',
})
export class PetCustomizationPage {
  private readonly petData = inject(PetData);
  private readonly petApi = inject(PetApi);
  private readonly router = inject(Router);
  readonly pet = this.petData.pet;
  private readonly routeData = inject(ActivatedRoute).snapshot.data;
  readonly firstSetup = this.routeData['firstSetup'] === true;
  readonly serverPet = this.routeData['serverPet'] === true;
  readonly selectedModes = signal<Set<CustomizationMode>>(new Set());
  readonly errorKey = signal<string | undefined>(undefined);
  readonly saving = signal(false);
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
    const pet = {
      ...(this.firstSetup
        ? {
            ...this.pet(),
            name: String(data.get('name')),
            species,
            birthDate: String(data.get('birthDate')),
            breed: undefined,
            photoUrl: undefined,
            activityLevel: 'moderate' as const,
            nutritionGoal: 'maintain' as const,
            targetWeightKg: undefined,
            dailyKcalTarget: undefined,
          }
        : this.pet()),
      conditions,
      tracking: [...tracking],
      profileModes: [...selected],
    };

    if (this.serverPet) {
      this.saving.set(true);
      this.petApi.createPet(pet).subscribe({
        next: (createdPet) => {
          this.petData.addPetFromServer(createdPet);
          this.finishSave();
          this.saving.set(false);
        },
        error: () => {
          this.errorKey.set('customization.apiSaveError');
          this.saving.set(false);
        },
      });
      return;
    }

    if (this.firstSetup) {
      try {
        this.petData.savePet(pet);
        this.finishSave();
      } catch (error) {
        this.handleSaveError(error);
      }
      return;
    }

    this.saving.set(true);
    this.petApi.updatePet(pet).subscribe({
      next: (updatedPet) => {
        try {
          this.petData.savePet(updatedPet);
          this.finishSave();
        } catch (error) {
          this.handleSaveError(error);
        } finally {
          this.saving.set(false);
        }
      },
      error: () => {
        this.errorKey.set('customization.apiSaveError');
        this.saving.set(false);
      },
    });
  }

  private finishSave(): void {
    if (this.firstSetup) {
      this.petData.completeSetup();
      void this.router.navigateByUrl('/');
    } else {
      void this.router.navigateByUrl('/profile');
    }
  }

  private handleSaveError(error: unknown): void {
    if (!(error instanceof Error) || error.message !== 'Pet profile details are invalid') {
      throw error;
    }
    this.errorKey.set('customization.saveError');
  }
}
