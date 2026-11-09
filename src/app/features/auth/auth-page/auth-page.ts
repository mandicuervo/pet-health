import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom, map } from 'rxjs';
import { PageHeader } from '../../../core/components/page-header/page-header';
import { FirebaseAuth, getFirebaseAuthErrorKey } from '../../../core/services/firebase-auth';
import { PetApi } from '../../../core/services/pet-api';
import { PetData } from '../../../core/services/pet-data';

type AuthMode = 'welcome' | 'login' | 'register';

function getAuthMode(value: unknown): AuthMode {
  if (value === 'welcome' || value === 'login' || value === 'register') {
    return value;
  }
  throw new Error(`Unsupported authentication page: ${String(value)}`);
}

@Component({
  imports: [PageHeader, RouterLink, TranslatePipe],
  selector: 'app-auth-page',
  styleUrl: './auth-page.scss',
  templateUrl: './auth-page.html',
})
export class AuthPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly firebaseAuth = inject(FirebaseAuth);
  private readonly petApi = inject(PetApi);
  private readonly petData = inject(PetData);
  private readonly routeMode = toSignal(
    this.route.data.pipe(map((data) => getAuthMode(data['authMode']))),
    { initialValue: getAuthMode(this.route.snapshot.data['authMode']) },
  );
  readonly mode = computed(() => this.routeMode());
  readonly showPassword = signal(false);
  readonly messageKey = signal<string | undefined>(undefined);
  readonly signingIn = signal(false);

  submit(event: Event): void {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) {
      throw new Error('Authentication form event did not originate from a form');
    }
    if (!form.reportValidity()) {
      return;
    }
    this.messageKey.set('auth.apiNotConnected');
  }

  async signInWithGoogle(): Promise<void> {
    if (this.signingIn()) {
      return;
    }

    this.signingIn.set(true);
    this.messageKey.set(undefined);
    try {
      await this.firebaseAuth.signInWithGoogle();
    } catch (error) {
      this.messageKey.set(getFirebaseAuthErrorKey(error));
      this.signingIn.set(false);
      return;
    }

    try {
      await firstValueFrom(this.petApi.getAuthenticatedUser());
      let pets = await firstValueFrom(this.petApi.getPets());
      const localSetupComplete = this.petData.setupComplete();
      const localPet = this.petData.pet();
      if (pets.length === 0 && localSetupComplete) {
        try {
          const claimedPet = await firstValueFrom(this.petApi.claimLegacyPet(localPet));
          this.petData.adoptLegacyPetFromServer(claimedPet);
          pets = [claimedPet];
        } catch (error) {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            pets = [];
          } else {
            throw error;
          }
        }
      }
      this.petData.setPetsFromServer(pets);
      this.signingIn.set(false);
      await this.router.navigateByUrl(pets.length > 0 ? '/' : '/pets/new');
    } catch {
      this.messageKey.set('auth.apiTokenValidationError');
      this.signingIn.set(false);
      return;
    }
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  clearMessage(): void {
    this.messageKey.set(undefined);
  }
}
