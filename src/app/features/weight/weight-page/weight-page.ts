import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { WeightEntry } from '../../../core/models/weight-entry.model';
import { PetData } from '../../../core/services/pet-data';
import { Theme } from '../../../core/services/theme';
import { localDateKey } from '../../../core/utils/date';

type Period = '3m' | '6m' | 'all';

interface ChartPoint {
  x: number;
  y: number;
  entry: WeightEntry;
}

@Component({
  imports: [DecimalPipe, RouterLink, TranslatePipe],
  selector: 'app-weight-page',
  styleUrl: './weight-page.scss',
  templateUrl: './weight-page.html',
})
export class WeightPage {
  private readonly petData = inject(PetData);
  private readonly translate = inject(TranslateService);
  readonly theme = inject(Theme);
  private readonly language = toSignal(
    this.translate.onLangChange.pipe(map(({ lang }) => lang)),
    { initialValue: this.translate.getCurrentLang() ?? 'en' },
  );

  readonly pet = this.petData.pet;
  readonly weightEntries = computed(() =>
    this.petData
      .weightEntries()
      .filter((entry) => entry.petId === this.pet().id)
      .sort((a, b) => b.date.localeCompare(a.date)),
  );
  readonly currentWeight = computed(() => this.weightEntries()[0]?.weightKg);
  readonly targetWeight = computed(() => this.pet().targetWeightKg);
  readonly targetDifference = computed(() => {
    const current = this.currentWeight();
    const target = this.targetWeight();
    return current === undefined || target === undefined
      ? undefined
      : Math.abs(current - target);
  });
  readonly monthlyChange = computed(() => {
    const entries = this.weightEntries();
    if (entries.length < 2) {
      return undefined;
    }

    const latestMonth = entries[0].date.slice(0, 7);
    const monthEntries = entries
      .filter((entry) => entry.date.slice(0, 7) === latestMonth)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (monthEntries.length < 2) {
      return undefined;
    }
    return Number(
      (monthEntries.at(-1)!.weightKg - monthEntries[0].weightKg).toFixed(1),
    );
  });
  readonly monthlyChangeAmount = computed(() =>
    Math.abs(this.monthlyChange() ?? 0),
  );

  readonly period = signal<Period>('3m');
  readonly showAllHistory = signal(false);
  readonly formOpen = signal(false);
  readonly editingEntryId = signal<string | undefined>(undefined);
  readonly formDate = signal(localDateKey(new Date()));
  readonly formWeight = signal('');
  readonly dateLocale = computed(() => {
    const language = this.language();
    return language.startsWith('pt')
      ? 'pt-BR'
      : language.startsWith('es')
        ? 'es'
        : 'en-US';
  });

  readonly chartEntries = computed(() => {
    const entries = [...this.weightEntries()].reverse();
    if (entries.length < 2 || this.period() === 'all') {
      return entries;
    }

    const newest = new Date(`${entries.at(-1)!.date}T00:00:00`);
    newest.setMonth(newest.getMonth() - (this.period() === '3m' ? 3 : 6));
    const fromDate = localDateKey(newest);
    return entries.filter((entry) => entry.date >= fromDate);
  });

  readonly chartPoints = computed<ChartPoint[]>(() => {
    const entries = this.chartEntries();
    if (entries.length === 0) {
      return [];
    }

    const weights = entries.map(({ weightKg }) => weightKg);
    const minimum = Math.floor(Math.min(...weights) * 10) / 10 - 0.1;
    const maximum = Math.ceil(Math.max(...weights) * 10) / 10 + 0.1;
    const firstDate = new Date(`${entries[0].date}T00:00:00`).getTime();
    const lastDate = new Date(`${entries.at(-1)!.date}T00:00:00`).getTime();
    const dateSpan = lastDate - firstDate;

    return entries.map((entry, index) => {
      const date = new Date(`${entry.date}T00:00:00`).getTime();
      const x =
        dateSpan === 0
          ? 48 + (index / Math.max(entries.length - 1, 1)) * 292
          : 48 + ((date - firstDate) / dateSpan) * 292;
      const y = 146 - ((entry.weightKg - minimum) / (maximum - minimum)) * 116;
      return { x, y, entry };
    });
  });
  readonly chartLine = computed(() =>
    this.chartPoints()
      .map(({ x, y }) => `${x},${y}`)
      .join(' '),
  );
  readonly chartArea = computed(() => {
    const points = this.chartPoints();
    if (points.length === 0) {
      return '';
    }
    return `48,146 ${points.map(({ x, y }) => `${x},${y}`).join(' ')} 340,146`;
  });
  readonly chartTicks = computed(() => {
    const weights = this.chartEntries().map(({ weightKg }) => weightKg);
    if (weights.length === 0) {
      return [];
    }

    const minimum = Math.floor(Math.min(...weights) * 10) / 10 - 0.1;
    const maximum = Math.ceil(Math.max(...weights) * 10) / 10 + 0.1;
    return [maximum, (maximum + minimum) / 2, minimum].map((value, index) => ({
      value: value.toFixed(1),
      y: 34 + index * 56,
    }));
  });
  readonly chartLabels = computed(() => {
    const entries = this.chartEntries();
    if (entries.length === 0) {
      return [];
    }
    const first = new Date(`${entries[0].date}T00:00:00`).getTime();
    const last = new Date(`${entries.at(-1)!.date}T00:00:00`).getTime();
    return [0, 1, 2, 3].map((index) => {
      const date = new Date(first + ((last - first) * index) / 3);
      return {
        x: 48 + (292 * index) / 3,
        label: new Intl.DateTimeFormat(this.dateLocale(), {
          month: 'short',
        }).format(date),
      };
    });
  });
  readonly visibleHistory = computed(() =>
    this.showAllHistory() ? this.weightEntries() : this.weightEntries().slice(0, 3),
  );

  setPeriod(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      throw new Error('Weight chart period event did not originate from a select element');
    }
    if (target.value !== '3m' && target.value !== '6m' && target.value !== 'all') {
      throw new Error(`Unsupported weight chart period: ${target.value}`);
    }
    this.period.set(target.value);
  }

  toggleHistory(): void {
    this.showAllHistory.update((showAll) => !showAll);
  }

  openNewEntry(): void {
    this.editingEntryId.set(undefined);
    this.formDate.set(localDateKey(new Date()));
    this.formWeight.set('');
    this.formOpen.set(true);
  }

  editEntry(entry: WeightEntry): void {
    this.editingEntryId.set(entry.id);
    this.formDate.set(entry.date);
    this.formWeight.set(String(entry.weightKg));
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  updateFormDate(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      throw new Error('Weight date event did not originate from an input element');
    }
    this.formDate.set(target.value);
  }

  updateFormWeight(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      throw new Error('Weight value event did not originate from an input element');
    }
    this.formWeight.set(target.value);
  }

  saveEntry(event: Event): void {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || !form.reportValidity()) {
      return;
    }
    const data = new FormData(form);
    this.petData.saveWeightEntry(
      String(data.get('date')),
      Number(data.get('weight')),
      this.editingEntryId(),
    );
    this.formOpen.set(false);
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat(this.dateLocale(), {
      day: '2-digit',
      month: 'long',
    }).format(new Date(`${date}T00:00:00`));
  }

  daysSince(date: string): number {
    const toUtcDays = (dateKey: string) => {
      const [year, month, day] = dateKey.split('-').map(Number);
      return Date.UTC(year, month - 1, day) / 86_400_000;
    };
    return Math.max(
      0,
      toUtcDays(localDateKey(new Date())) - toUtcDays(date),
    );
  }
}
