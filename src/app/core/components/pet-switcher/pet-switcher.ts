import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Pet } from '../../models/pet.model';
import { PetData } from '../../services/pet-data';

@Component({
  imports: [TranslatePipe],
  selector: 'app-pet-switcher',
  styleUrl: './pet-switcher.scss',
  templateUrl: './pet-switcher.html',
})
export class PetSwitcher {
  private readonly petData = inject(PetData);
  private readonly router = inject(Router);

  readonly pet = this.petData.pet;
  readonly pets = this.petData.pets;
  readonly open = signal(false);

  openSelector(): void {
    this.open.set(true);
  }

  closeSelector(): void {
    this.open.set(false);
  }

  selectPet(pet: Pet): void {
    this.petData.selectPet(pet.id);
    this.closeSelector();
  }

  async addPet(): Promise<void> {
    this.closeSelector();
    await this.router.navigateByUrl('/pets/new');
  }
}
