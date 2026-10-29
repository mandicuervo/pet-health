import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';

type AuthMode = 'welcome' | 'login' | 'register';

function getAuthMode(value: unknown): AuthMode {
  if (value === 'welcome' || value === 'login' || value === 'register') {
    return value;
  }
  throw new Error(`Unsupported authentication page: ${String(value)}`);
}

@Component({
  imports: [RouterLink, TranslatePipe],
  selector: 'app-auth-page',
  styleUrl: './auth-page.scss',
  templateUrl: './auth-page.html',
})
export class AuthPage {
  private readonly route = inject(ActivatedRoute);
  private readonly routeMode = toSignal(
    this.route.data.pipe(map((data) => getAuthMode(data['authMode']))),
    { initialValue: getAuthMode(this.route.snapshot.data['authMode']) },
  );
  readonly mode = computed(() => this.routeMode());
  readonly showPassword = signal(false);
  readonly messageKey = signal<string | undefined>(undefined);

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

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  clearMessage(): void {
    this.messageKey.set(undefined);
  }
}
