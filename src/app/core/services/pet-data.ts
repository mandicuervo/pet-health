import { computed, Service, signal } from '@angular/core';
import { Pet } from '../models/pet.model';
import { WeightEntry } from '../models/weight-entry.model';
import { MealEvent } from '../models/meal-event.model';
import { Food } from '../models/food.model';
import { localDateKey } from '../utils/date';

function todayAt(time: string): string {
  return `${localDateKey(new Date())}T${time}`;
}

@Service()
export class PetData {
  // This date is set when the service is created and does not refresh at midnight yet.
  private readonly today = signal(localDateKey(new Date()));

  private readonly _pet = signal<Pet>({
    id: '1',
    name: 'Bagheera',
    species: 'cat',
    birthDate: '2019-04-26',
    nutritionGoal: 'lose',
    targetWeightKg: 5.5,
    dailyKcalTarget: 250,
  });

  private readonly _weightEntries = signal<WeightEntry[]>([
    { id: 'w1', petId: '1', date: '2026-09-10', weightKg: 6.4 },
    { id: 'w2', petId: '1', date: '2026-09-17', weightKg: 6.3 },
    { id: 'w3', petId: '1', date: '2026-09-24', weightKg: 6.2 },
    { id: 'w4', petId: '1', date: '2026-10-01', weightKg: 6.2 },
    { id: 'w5', petId: '1', date: '2026-10-08', weightKg: 6.1 },
    { id: 'w6', petId: '1', date: '2026-10-15', weightKg: 6.0 },
  ]);

  private readonly _foods = signal<Food[]>([
    { id: 'f1', name: 'Ração seca para controle de peso', kcalPerKg: 3200, category: 'dryFood' },
    { id: 'f2', name: 'Ração úmida para gatos', kcalPerKg: 950, category: 'wetFood' },
    { id: 'f3', name: 'Petisco', kcalPerKg: 3250, category: 'treat' },
  ]);

  private readonly _mealEvents = signal<MealEvent[]>([
    {
      id: 'm1',
      petId: '1',
      type: 'meal',
      foodId: 'f1',
      grams: 15,
      eatenAt: todayAt('07:30:00'),
    },
    {
      id: 'm2',
      petId: '1',
      type: 'meal',
      foodId: 'f2',
      grams: 100,
      eatenAt: todayAt('12:30:00'),
    },
    {
      id: 'm3',
      petId: '1',
      type: 'treat',
      grams: 10,
      foodId: 'f3',
      eatenAt: todayAt('16:15:00'),
    },
  ]);

  readonly pet = this._pet.asReadonly();
  readonly weightEntries = this._weightEntries.asReadonly();
  readonly foods = this._foods.asReadonly();
  readonly mealEvents = this._mealEvents.asReadonly();

  private readonly sortedWeightEntries = computed(() =>
    [...this._weightEntries()].sort((a, b) => a.date.localeCompare(b.date)),
  );

  readonly currentWeightKg = computed<number | undefined>(() => {
    return this.sortedWeightEntries().at(-1)?.weightKg;
  });

  private readonly foodsById = computed(
    () => new Map(this._foods().map((food) => [food.id, food])),
  );

  readonly kcalToday = computed(() => {
    const today = this.today();
    const foodsById = this.foodsById();
    return this._mealEvents().reduce((total, event) => {
      if (localDateKey(new Date(event.eatenAt)) !== today) {
        return total;
      }

      const food = foodsById.get(event.foodId);
      if (!food) {
        throw new Error(`Food ${event.foodId} not found for meal ${event.id}`);
      }

      return total + (event.grams * food.kcalPerKg) / 1000;
    }, 0);
  });

  readonly kcalRemainingToday = computed<number | undefined>(() => {
    const target = this._pet().dailyKcalTarget;
    return target === undefined ? undefined : target - this.kcalToday();
  });

  readonly weightChangeKg = computed(() => {
    const entries = this.sortedWeightEntries();
    if (entries.length < 2) {
      return 0;
    }

    return Number(
      (entries[entries.length - 1].weightKg - entries[0].weightKg).toFixed(2),
    );
  });

  saveWeightEntry(date: string, weightKg: number, id?: string): void {
    const parsedDate = new Date(`${date}T00:00:00`);
    if (
      !Number.isFinite(weightKg) ||
      weightKg <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      localDateKey(parsedDate) !== date
    ) {
      throw new Error('A valid date and positive weight are required');
    }

    this._weightEntries.update((entries) => {
      if (id && !entries.some((entry) => entry.id === id)) {
        throw new Error(`Weight entry ${id} not found`);
      }

      if (id) {
        return entries.map((entry) =>
          entry.id === id ? { ...entry, date, weightKg } : entry,
        );
      }

      return [
        ...entries,
        {
          id: `w${Date.now()}`,
          petId: this._pet().id,
          date,
          weightKg,
        },
      ];
    });
  }
}
