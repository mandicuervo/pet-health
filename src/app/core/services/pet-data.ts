import { computed, Service, signal } from '@angular/core';
import { Pet } from '../models/pet.model';
import { WeightEntry } from '../models/weight-entry.model';
import { MealEvent } from '../models/meal-event.model';
import { Food } from '../models/food.model';

@Service()
export class PetData {
  private readonly _pet = signal<Pet>({
    id: '1',
    name: 'Rubio',
    species: 'cat',
    birthDate: '2020-03-12',
    nutritionGoal: 'lose',
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
    { id: 'f1', name: 'Ração seca para controle de peso', kcalPerKg: 3200 },
    { id: 'f2', name: 'Ração úmida para gatos', kcalPerKg: 950 },
  ]);

  private readonly _mealEvents = signal<MealEvent[]>([
    {
      id: 'm1',
      petId: '1',
      type: 'meal',
      foodId: 'f1',
      grams: 35,
      scheduledTime: '2026-10-15T08:00:00',
      completedAt: '2026-10-15T08:10:00',
    },
    {
      id: 'm2',
      petId: '1',
      type: 'meal',
      foodId: 'f2',
      grams: 40,
      scheduledTime: '2026-10-15T13:00:00',
      completedAt: '2026-10-15T13:05:00',
    },
    {
      id: 'm3',
      petId: '1',
      type: 'meal',
      foodId: 'f1',
      grams: 35,
      scheduledTime: '2026-10-15T20:00:00',
    },
  ]);

  readonly pet = this._pet.asReadonly();
  readonly weightEntries = this._weightEntries.asReadonly();
  readonly foods = this._foods.asReadonly();
  readonly mealEvents = this._mealEvents.asReadonly();

  readonly weightChangeKg = computed(() => {
    const entries = this._weightEntries();
    if (entries.length < 2) {
      return 0;
    }

    const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    return Number(
      (sortedEntries[sortedEntries.length - 1].weightKg - sortedEntries[0].weightKg).toFixed(2),
    );
  });
}
