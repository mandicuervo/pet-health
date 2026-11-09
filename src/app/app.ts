import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BottomNavigation } from './core/components/bottom-navigation/bottom-navigation';
import { FirebaseAuth } from './core/services/firebase-auth';
import { PetApi } from './core/services/pet-api';
import { PetData } from './core/services/pet-data';
import { Theme } from './core/services/theme';
import { filter, map } from 'rxjs';

@Component({
  imports: [RouterOutlet, BottomNavigation],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('pet-health');
  private readonly router = inject(Router);
  private readonly firebaseAuth = inject(FirebaseAuth);
  private readonly petApi = inject(PetApi);
  private readonly petData = inject(PetData);
  readonly setupComplete = this.petData.setupComplete;
  readonly authPage = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => this.isAuthRoute(event.urlAfterRedirects)),
    ),
    { initialValue: this.isAuthRoute(this.router.url) },
  );
  private readonly theme = inject(Theme);

  constructor() {
    void this.loadSignedInPets();
  }

  private async loadSignedInPets(): Promise<void> {
    try {
      const token = await this.firebaseAuth.getIdToken();
      if (!token) {
        return;
      }

      let pets = await firstValueFrom(this.petApi.getPets());
      const hadLocalSetup = this.petData.setupComplete();
      const localPet = this.petData.pet();
      if (pets.length === 0 && hadLocalSetup) {
        try {
          const claimedPet = await firstValueFrom(
            this.petApi.claimLegacyPet(localPet),
          );
          this.petData.adoptLegacyPetFromServer(claimedPet);
          pets = [claimedPet];
        } catch (error) {
          if (!(error instanceof HttpErrorResponse) || error.status !== 404) {
            throw error;
          }
        }
      }

      this.petData.setPetsFromServer(pets);
      if (pets.length === 0 && !this.isAuthRoute(this.router.url)) {
        await this.router.navigateByUrl('/pets/new');
      }
    } catch (error) {
      console.error('Could not load pets for the signed-in user:', error);
    }
  }

  private isAuthRoute(url: string): boolean {
    return ['/welcome', '/login', '/register'].includes(url.split('?')[0]);
  }
}
