import { DecimalPipe, DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Pet } from '../../../core/models/pet.model';
import { PetData } from '../../../core/services/pet-data';

type ProfilePanel = 'health' | 'help' | 'signOut' | undefined;

@Component({
  imports: [DecimalPipe, RouterLink, TranslatePipe],
  selector: 'app-profile-page',
  styleUrl: './profile-page.scss',
  templateUrl: './profile-page.html',
})
export class ProfilePage {
  private readonly petData = inject(PetData);
  private readonly storage = inject(DOCUMENT).defaultView?.localStorage;

  readonly pet = this.petData.pet;
  readonly editing = signal(false);
  readonly notificationsEnabled = signal(
    this.storage?.getItem('pet-health-notifications') === 'true',
  );
  readonly openPanel = signal<ProfilePanel>(undefined);
  readonly errorKey = signal<string | undefined>(undefined);
  readonly today = new Date();
  readonly age = computed(() => {
    const birthDate = new Date(`${this.pet().birthDate}T00:00:00`);
    let years = this.today.getFullYear() - birthDate.getFullYear();
    const birthdayHasPassed =
      this.today.getMonth() > birthDate.getMonth() ||
      (this.today.getMonth() === birthDate.getMonth() &&
        this.today.getDate() >= birthDate.getDate());
    if (!birthdayHasPassed) {
      years -= 1;
    }
    return Math.max(0, years);
  });
  readonly speciesKey = computed(() => `pet.species.${this.pet().species}`);
  readonly activityKey = computed(() => {
    const level = this.pet().activityLevel ?? 'moderate';
    return `profile.activity${level[0].toUpperCase()}${level.slice(1)}`;
  });

  toggleEditing(): void {
    this.editing.update((editing) => !editing);
    this.errorKey.set(undefined);
  }

  toggleNotifications(): void {
    const enabled = !this.notificationsEnabled();
    this.storage?.setItem('pet-health-notifications', String(enabled));
    this.notificationsEnabled.set(enabled);
  }

  togglePanel(panel: Exclude<ProfilePanel, undefined>): void {
    this.openPanel.update((current) => (current === panel ? undefined : panel));
  }

  updatePhoto(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Pet photo event did not originate from an input element');
    }
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/') || file.size > 2_000_000) {
      this.errorKey.set('profile.invalidPhoto');
      input.value = '';
      return;
    }

    void this.savePhoto(file);
    input.value = '';
  }

  saveProfile(event: Event): void {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || !form.reportValidity()) {
      return;
    }
    const data = new FormData(form);
    const species = String(data.get('species'));
    const activityLevel = String(data.get('activityLevel'));
    if (
      (species !== 'cat' && species !== 'dog') ||
      (activityLevel !== 'low' &&
        activityLevel !== 'moderate' &&
        activityLevel !== 'high')
    ) {
      throw new Error('Unsupported pet profile selection');
    }
    const targetWeightValue = String(data.get('targetWeight'));

    this.savePet({
      ...this.pet(),
      name: String(data.get('name')),
      species,
      breed: String(data.get('breed')),
      birthDate: String(data.get('birthDate')),
      targetWeightKg:
        targetWeightValue === '' ? undefined : Number(targetWeightValue),
      activityLevel,
    });
  }

  closeEditing(): void {
    this.editing.set(false);
    this.errorKey.set(undefined);
  }

  private savePet(pet: Pet): void {
    try {
      this.petData.savePet(pet);
      this.editing.set(false);
      this.errorKey.set(undefined);
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      this.errorKey.set(
        error.message === 'Pet profile details are invalid'
          ? 'profile.invalidProfile'
          : 'profile.saveError',
      );
    }
  }

  private async savePhoto(file: File): Promise<void> {
    try {
      const photoUrl = await this.compressPhoto(file);
      this.petData.savePet({ ...this.pet(), photoUrl });
      this.errorKey.set(undefined);
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      this.errorKey.set(
        error.message === 'Photo could not be decoded'
          ? 'profile.photoReadError'
          : 'profile.saveError',
      );
    }
  }

  private async compressPhoto(file: File): Promise<string> {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new Error('Photo could not be decoded');
    }

    try {
      const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Photo compression is unavailable');
      }
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) =>
            result
              ? resolve(result)
              : reject(new Error('Photo compression failed')),
          'image/jpeg',
          0.8,
        );
      });

      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () =>
          reject(new Error('Photo could not be decoded'));
        reader.onload = () => {
          if (typeof reader.result !== 'string') {
            reject(new Error('Photo could not be decoded'));
            return;
          }
          resolve(reader.result);
        };
        reader.readAsDataURL(blob);
      });
    } finally {
      bitmap.close();
    }
  }
}
