import { DecimalPipe, DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FoodCategory } from '../../../core/models/food.model';
import { PetData } from '../../../core/services/pet-data';

type LanguageCode = 'en' | 'pt' | 'es';

interface DashboardRecord {
  typeKey: string;
  grams: number;
  calories: number;
  time: string;
  type: FoodCategory;
}

@Component({
  imports: [DecimalPipe, TranslatePipe],
  selector: 'app-dashboard-page',
  styleUrl: './dashboard-page.scss',
  templateUrl: './dashboard-page.html',
})
export class DashboardPage {
  private readonly petData = inject(PetData);
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  readonly activeLanguage = signal<LanguageCode>('en');
  readonly languages: { code: LanguageCode; key: string }[] = [
    { code: 'en', key: 'language.english' },
    { code: 'pt', key: 'language.portuguese' },
    { code: 'es', key: 'language.spanish' },
  ];
  readonly pet = this.petData.pet;
  readonly weight = this.petData.currentWeightKg;
  readonly calories = this.petData.kcalToday;
  readonly caloriesRemaining = this.petData.kcalRemainingToday;
  readonly addMenuOpen = signal(false);
  readonly weightChange = this.petData.weightChangeKg;
  readonly calorieProgress = computed(() => {
    const target = this.pet().dailyKcalTarget;
    return target === undefined || target <= 0
      ? 0
      : Math.min(100, (this.calories() / target) * 100);
  });

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
        typeKey: `dashboard.foodTypes.${type}`,
        grams: event.grams,
        calories: (event.grams * food.kcalPerKg) / 1000,
        time,
        type,
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

  toggleAddMenu(): void {
    this.addMenuOpen.update((isOpen) => !isOpen);
  }
}
