import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'soft';

const THEME_STORAGE_KEY = 'pet-health-theme';

@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly document = inject(DOCUMENT);
  private readonly storage = this.document.defaultView?.localStorage;
  readonly mode = signal<ThemeMode>(this.readSavedMode());

  constructor() {
    this.apply(this.mode());
  }

  toggle(): void {
    const nextMode = this.mode() === 'dark' ? 'soft' : 'dark';
    this.mode.set(nextMode);
    this.apply(nextMode);
    this.storage?.setItem(THEME_STORAGE_KEY, nextMode);
  }

  private readSavedMode(): ThemeMode {
    const savedMode = this.storage?.getItem(THEME_STORAGE_KEY);
    return savedMode === 'soft' || savedMode === 'dark' ? savedMode : 'dark';
  }

  private apply(mode: ThemeMode): void {
    this.document.documentElement.setAttribute('data-theme', mode);
  }
}
