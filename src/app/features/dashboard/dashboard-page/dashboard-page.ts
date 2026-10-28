import { DecimalPipe, DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FoodCategory } from '../../../core/models/food.model';
import { HealthEntry } from '../../../core/models/health-entry.model';
import { localDateKey } from '../../../core/utils/date';
import { PetData } from '../../../core/services/pet-data';
import { Theme } from '../../../core/services/theme';

type LanguageCode = 'en' | 'pt' | 'es';

interface DashboardRecord {
  id: string;
  typeKey: string;
  grams: number;
  calories: number;
  time: string;
  type: FoodCategory;
}

interface DashboardHealthRecord {
  id: string;
  type: HealthEntry['type'];
  typeKey: string;
  medicationName?: string;
  amount: string;
  time: string;
}

@Component({
  imports: [DecimalPipe, RouterLink, TranslatePipe],
  selector: 'app-dashboard-page',
  styleUrl: './dashboard-page.scss',
  templateUrl: './dashboard-page.html',
})
export class DashboardPage {
  private readonly petData = inject(PetData);
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);
  readonly theme = inject(Theme);

  readonly activeLanguage = signal<LanguageCode>('en');
  readonly languages: { code: LanguageCode; key: string }[] = [
    { code: 'en', key: 'language.english' },
    { code: 'pt', key: 'language.portuguese' },
    { code: 'es', key: 'language.spanish' },
  ];
  readonly pet = this.petData.pet;
  readonly weight = this.petData.currentWeightKg;
  readonly weightEnabled = computed(() => this.pet().tracking.includes('weight'));
  readonly foodEnabled = computed(() => this.pet().tracking.includes('food'));
  readonly glucoseEnabled = computed(() => this.pet().tracking.includes('bloodGlucose'));
  readonly healthTrackingEnabled = computed(() =>
    this.pet().tracking.some((item) =>
      ['bloodGlucose', 'insulin', 'medication'].includes(item),
    ),
  );
  readonly calories = this.petData.kcalToday;
  readonly caloriesRemaining = this.petData.kcalRemainingToday;
  readonly weightChange = this.petData.weightChangeKg;
  readonly calorieProgress = computed(() => {
    const target = this.pet().dailyKcalTarget;
    return target === undefined || target <= 0
      ? 0
      : Math.min(100, (this.calories() / target) * 100);
  });
  readonly latestGlucose = computed(() =>
    this.latestHealthEntry('bloodGlucose'),
  );
  readonly latestInsulin = computed(() => this.latestHealthEntry('insulin'));
  readonly latestMedication = computed(() =>
    this.latestHealthEntry('medication'),
  );
  readonly latestGlucoseTime = computed(() =>
    this.formatTime(this.latestGlucose()?.measuredAt),
  );

  readonly records = computed<DashboardRecord[]>(() => {
    const meals = this.petData.mealEvents()
      .filter((event) => event.petId === this.pet().id)
      .sort((a, b) => a.eatenAt.localeCompare(b.eatenAt));
    const foodById = new Map(this.petData.foods().map((food) => [food.id, food]));
    const locale =
      this.activeLanguage() === 'pt'
        ? 'pt-BR'
        : this.activeLanguage() === 'es'
          ? 'es'
          : 'en-US';

    return meals.map((event) => {
      const time = new Date(event.eatenAt).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      });
      const food = foodById.get(event.foodId);

      if (!food) {
        throw new Error(`Food ${event.foodId} not found for meal ${event.id}`);
      }

      const type = event.type === 'treat' ? 'treat' : food.category;
      return {
        id: event.id,
        typeKey: `dashboard.foodTypes.${type}`,
        grams: event.grams,
        calories: (event.grams * food.kcalPerKg) / 1000,
        time,
        type,
      };
    });
  });

  readonly healthRecords = computed<DashboardHealthRecord[]>(() => {
    const today = localDateKey(new Date());
    const entries = this.petData.healthEntries()
      .filter(
        (entry) =>
          entry.petId === this.pet().id &&
          localDateKey(
            new Date('measuredAt' in entry ? entry.measuredAt : entry.administeredAt),
          ) === today,
      )
      .sort((a, b) => this.entryTime(a).localeCompare(this.entryTime(b)));

    return entries.map((entry) => {
      const eventTime = this.entryTime(entry);
      const amount =
        entry.type === 'bloodGlucose'
          ? `${entry.valueMgDl} mg/dL`
          : entry.type === 'insulin'
            ? `${entry.doseUnits} UI`
            : `${entry.doseAmount} ${entry.doseUnit}`;
      return {
        id: entry.id,
        type: entry.type,
        typeKey: `records.${entry.type}`,
        ...(entry.type === 'medication'
          ? { medicationName: entry.medicationName }
          : {}),
        amount,
        time: this.formatTime(eventTime),
      };
    });
  });

  setLanguage(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      throw new Error('Language selector event did not originate from a select element');
    }

    const language = this.languages.find(
      ({ code }) => code === target.value,
    )?.code;
    if (!language) {
      throw new Error(`Unsupported language: ${target.value}`);
    }

    this.activeLanguage.set(language);
    this.document.documentElement.lang =
      language === 'pt' ? 'pt-BR' : language === 'es' ? 'es' : 'en';
    this.translate.use(language);
  }

  private latestHealthEntry<T extends HealthEntry['type']>(
    type: T,
  ): Extract<HealthEntry, { type: T }> | undefined {
    const entries = this.petData.healthEntries()
      .filter(
        (entry): entry is Extract<HealthEntry, { type: T }> =>
          entry.petId === this.pet().id && entry.type === type,
      )
      .sort((a, b) => this.entryTime(a).localeCompare(this.entryTime(b)));
    return entries.at(-1);
  }

  private entryTime(entry: HealthEntry): string {
    return 'measuredAt' in entry ? entry.measuredAt : entry.administeredAt;
  }

  formatTime(dateTime: string | undefined): string {
    if (!dateTime) {
      return '';
    }
    const locale =
      this.activeLanguage() === 'pt'
        ? 'pt-BR'
        : this.activeLanguage() === 'es'
          ? 'es'
          : 'en-US';
    return new Date(dateTime).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
  }
}
