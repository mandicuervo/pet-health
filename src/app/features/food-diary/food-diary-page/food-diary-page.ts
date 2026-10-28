import { DecimalPipe, DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Food, FoodCategory } from '../../../core/models/food.model';
import { MealEvent } from '../../../core/models/meal-event.model';
import { PetData } from '../../../core/services/pet-data';
import { localDateKey } from '../../../core/utils/date';

interface DiaryDate {
  key: string;
  date: Date;
  dayNumber: number;
  weekday: string;
  inCurrentMonth: boolean;
  hasMeals: boolean;
}

interface DiaryMeal {
  id: string;
  name: string;
  category: FoodCategory;
  grams: number;
  calories: number;
  time: string;
}

@Component({
  imports: [DecimalPipe, RouterLink, TranslatePipe],
  selector: 'app-food-diary-page',
  styleUrl: './food-diary-page.scss',
  templateUrl: './food-diary-page.html',
})
export class FoodDiaryPage {
  private readonly petData = inject(PetData);
  private readonly document = inject(DOCUMENT);
  readonly pet = this.petData.pet;
  readonly selectedDate = signal(localDateKey(new Date()));
  readonly monthlyView = signal(false);

  readonly weekDates = computed(() => {
    const selected = this.parseDate(this.selectedDate());
    const start = new Date(selected);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return this.toDiaryDate(date, true);
    });
  });

  readonly monthDates = computed(() => {
    const selected = this.parseDate(this.selectedDate());
    const monthStart = new Date(
      selected.getFullYear(),
      selected.getMonth(),
      1,
      12,
    );
    const start = new Date(monthStart);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const monthEnd = new Date(
      selected.getFullYear(),
      selected.getMonth() + 1,
      0,
      12,
    );
    const end = new Date(monthEnd);
    end.setDate(end.getDate() + (6 - ((end.getDay() + 6) % 7)));
    const dates: DiaryDate[] = [];

    for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(
        this.toDiaryDate(
          new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12),
          date.getMonth() === selected.getMonth(),
        ),
      );
    }

    return dates;
  });

  readonly monthLabel = computed(() =>
    this.parseDate(this.selectedDate()).toLocaleDateString(this.locale(), {
      month: 'long',
      year: 'numeric',
    }),
  );

  readonly meals = computed<DiaryMeal[]>(() => {
    const foodsById = new Map(this.petData.foods().map((food) => [food.id, food]));

    return this.petData.mealEvents()
      .filter(
        (event) =>
          event.petId === this.pet().id &&
          localDateKey(new Date(event.eatenAt)) === this.selectedDate(),
      )
      .sort((a, b) => a.eatenAt.localeCompare(b.eatenAt))
      .map((event) => this.toDiaryMeal(event, foodsById));
  });

  readonly totalCalories = computed(() =>
    this.meals().reduce((total, meal) => total + meal.calories, 0),
  );

  readonly remainingCalories = computed<number | undefined>(() => {
    const target = this.pet().dailyKcalTarget;
    return target === undefined ? undefined : target - this.totalCalories();
  });

  selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  shiftMonth(amount: number): void {
    const date = this.parseDate(this.selectedDate());
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + amount);
    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      12,
    ).getDate();
    date.setDate(Math.min(day, lastDay));
    this.selectedDate.set(localDateKey(date));
  }

  toggleView(): void {
    this.monthlyView.update((visible) => !visible);
  }

  formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
    return date.toLocaleDateString(this.locale(), options);
  }

  mealTypeKey(category: FoodCategory): string {
    return `dashboard.foodTypes.${category}`;
  }

  private toDiaryMeal(
    event: MealEvent,
    foodsById: Map<string, Food>,
  ): DiaryMeal {
    const food = foodsById.get(event.foodId);
    if (!food) {
      throw new Error(`Food ${event.foodId} not found for meal ${event.id}`);
    }

    return {
      id: event.id,
      name: food.name,
      category: event.type === 'treat' ? 'treat' : food.category,
      grams: event.grams,
      calories: (event.grams * food.kcalPerKg) / 1000,
      time: new Date(event.eatenAt).toLocaleTimeString(this.locale(), {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }),
    };
  }

  private toDiaryDate(date: Date, inCurrentMonth: boolean): DiaryDate {
    const key = localDateKey(date);
    const hasMeals = this.petData.mealEvents().some(
      (event) =>
        event.petId === this.pet().id &&
        localDateKey(new Date(event.eatenAt)) === key,
    );

    return {
      key,
      date,
      dayNumber: date.getDate(),
      weekday: date.toLocaleDateString(this.locale(), { weekday: 'short' }),
      inCurrentMonth,
      hasMeals,
    };
  }

  private parseDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day, 12);
  }

  private locale(): string {
    return this.document.documentElement.lang || 'pt-BR';
  }
}
