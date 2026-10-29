import { DOCUMENT } from '@angular/common';
import { computed, inject, Service, signal } from '@angular/core';
import { HealthEntry } from '../models/health-entry.model';
import { Pet } from '../models/pet.model';
import { WeightEntry } from '../models/weight-entry.model';
import { MealEvent } from '../models/meal-event.model';
import { DailyFoodPlan, Food } from '../models/food.model';
import { localDateKey } from '../utils/date';

const STORAGE_KEY = 'pet-health-data';
const SETUP_STORAGE_KEY = 'pet-health-setup-complete';
const STORAGE_VERSION = 1;

interface PersistedPetData {
  version: typeof STORAGE_VERSION;
  pet: Pet;
  weightEntries: WeightEntry[];
  foods: Food[];
  dailyFoodPlan: DailyFoodPlan;
  mealEvents: MealEvent[];
  healthEntries: HealthEntry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(isRecord);
}

function isPersistedPetData(value: unknown): value is PersistedPetData {
  if (
    !isRecord(value) ||
    value['version'] !== STORAGE_VERSION ||
    !isRecord(value['pet']) ||
    !isRecordArray(value['weightEntries']) ||
    !isRecordArray(value['foods']) ||
    !isRecord(value['dailyFoodPlan']) ||
    !isRecordArray(value['mealEvents']) ||
    !isRecordArray(value['healthEntries'])
  ) {
    return false;
  }

  const pet = value['pet'];
  const plan = value['dailyFoodPlan'];
  const profileModes = pet['profileModes'];
  const hasValidProfileModes =
    profileModes === undefined ||
    (Array.isArray(profileModes) &&
      profileModes.every(
        (mode) =>
          typeof mode === 'string' &&
          ['diabetes', 'obesity', 'journal'].includes(mode),
      ));

  return (
    typeof pet['id'] === 'string' &&
    typeof pet['name'] === 'string' &&
    typeof pet['birthDate'] === 'string' &&
    Array.isArray(pet['conditions']) &&
    pet['conditions'].every(
      (condition) =>
        typeof condition === 'string' &&
        ['obesity', 'diabetes', 'other'].includes(condition),
    ) &&
    Array.isArray(pet['tracking']) &&
    pet['tracking'].every(
      (tracking) =>
        typeof tracking === 'string' &&
        ['weight', 'bloodGlucose', 'insulin', 'food', 'medication'].includes(
          tracking,
        ),
    ) &&
    hasValidProfileModes &&
    ['morningGrams', 'afternoonGrams', 'nightGrams'].every(
      (key) => typeof plan[key] === 'number' && Number.isFinite(plan[key]),
    )
  );
}

function todayAt(time: string): string {
  return `${localDateKey(new Date())}T${time}`;
}

@Service()
export class PetData {
  private readonly storage = inject(DOCUMENT).defaultView?.localStorage;
  readonly setupComplete = signal(
    this.storage?.getItem(SETUP_STORAGE_KEY) === 'true',
  );

  // This date is set when the service is created and does not refresh at midnight yet.
  private readonly today = signal(localDateKey(new Date()));

  private readonly _pet = signal<Pet>({
    id: '1',
    name: 'Bagheera',
    species: 'cat',
    birthDate: '2019-04-26',
    nutritionGoal: 'lose',
    activityLevel: 'moderate',
    targetWeightKg: 5.5,
    dailyKcalTarget: 250,
    conditions: ['obesity'],
    tracking: ['weight', 'food'],
    profileModes: ['obesity'],
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
    {
      id: 'f1',
      name: 'Ração Seca Premium',
      brand: 'ROYAL CANIN LIGHT',
      kcalPerKg: 3200,
      fiberPercent: 12,
      category: 'dryFood',
    },
    {
      id: 'f2',
      name: 'Sachê Atum',
      brand: 'FANCY FEAST',
      kcalPerKg: 950,
      proteinPercent: 10,
      category: 'wetFood',
    },
    {
      id: 'f3',
      name: 'Petisco Dreamies',
      brand: 'QUELLO',
      kcalPerKg: 2000,
      kcalPerUnit: 2,
      category: 'treat',
    },
  ]);
  private readonly _dailyFoodPlan = signal<DailyFoodPlan>({
    morningGrams: 15,
    afternoonGrams: 100,
    nightGrams: 15,
  });

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
  private readonly _healthEntries = signal<HealthEntry[]>([]);

  readonly pet = this._pet.asReadonly();
  readonly weightEntries = this._weightEntries.asReadonly();
  readonly foods = this._foods.asReadonly();
  readonly dailyFoodPlan = this._dailyFoodPlan.asReadonly();
  readonly mealEvents = this._mealEvents.asReadonly();
  readonly healthEntries = this._healthEntries.asReadonly();

  constructor() {
    this.restorePersistedData();
  }

  completeSetup(): void {
    this.storage?.setItem(SETUP_STORAGE_KEY, 'true');
    this.setupComplete.set(true);
  }

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
    this.persistData();
  }

  savePet(pet: Pet): void {
    const parsedBirthDate = new Date(`${pet.birthDate}T00:00:00`);
    if (
      pet.id !== this._pet().id ||
      !pet.name.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(pet.birthDate) ||
      localDateKey(parsedBirthDate) !== pet.birthDate ||
      parsedBirthDate > new Date() ||
      !Array.isArray(pet.conditions) ||
      pet.conditions.some(
        (condition) =>
          !['obesity', 'diabetes', 'other'].includes(condition),
      ) ||
      new Set(pet.conditions).size !== pet.conditions.length ||
      !Array.isArray(pet.tracking) ||
      pet.tracking.some(
        (tracking) =>
          !['weight', 'bloodGlucose', 'insulin', 'food', 'medication'].includes(
            tracking,
          ),
      ) ||
      new Set(pet.tracking).size !== pet.tracking.length ||
      (pet.profileModes !== undefined &&
        (!Array.isArray(pet.profileModes) ||
          pet.profileModes.some(
            (mode) => !['diabetes', 'obesity', 'journal'].includes(mode),
          ) ||
          new Set(pet.profileModes).size !== pet.profileModes.length)) ||
      (pet.targetWeightKg !== undefined &&
        (!Number.isFinite(pet.targetWeightKg) || pet.targetWeightKg <= 0)) ||
      (pet.activityLevel !== undefined &&
        !['low', 'moderate', 'high'].includes(pet.activityLevel))
    ) {
      throw new Error('Pet profile details are invalid');
    }

    const normalizedPet: Pet = {
      ...pet,
      name: pet.name.trim(),
      breed: pet.breed?.trim() || undefined,
      profileModes: pet.profileModes ?? [],
    };
    this.persistData(normalizedPet);
    this._pet.set(normalizedPet);
  }

  saveFood(
    food: Omit<Food, 'id'>,
    id?: string,
  ): Food {
    if (
      !food.name.trim() ||
      !Number.isFinite(food.kcalPerKg) ||
      food.kcalPerKg <= 0 ||
      !['dryFood', 'wetFood', 'treat'].includes(food.category) ||
      (food.kcalPerUnit !== undefined &&
        (!Number.isFinite(food.kcalPerUnit) || food.kcalPerUnit < 0)) ||
      (food.fiberPercent !== undefined &&
        (!Number.isFinite(food.fiberPercent) ||
          food.fiberPercent < 0 ||
          food.fiberPercent > 100)) ||
      (food.proteinPercent !== undefined &&
        (!Number.isFinite(food.proteinPercent) ||
          food.proteinPercent < 0 ||
          food.proteinPercent > 100))
    ) {
      throw new Error('Food details are invalid');
    }

    const normalizedFood: Omit<Food, 'id'> = {
      ...food,
      name: food.name.trim(),
      brand: food.brand?.trim() || undefined,
    };
    const savedFood: Food = {
      ...normalizedFood,
      id: id ?? `f${Date.now()}`,
    };

    this._foods.update((foods) => {
      if (id && !foods.some((item) => item.id === id)) {
        throw new Error(`Food ${id} not found`);
      }
      if (id) {
        return foods.map((item) =>
          item.id === id ? savedFood : item,
        );
      }
      return [...foods, savedFood];
    });
    this.persistData();
    return savedFood;
  }

  deleteFood(id: string): 'deleted' | 'in-use' {
    if (!this._foods().some((food) => food.id === id)) {
      throw new Error(`Food ${id} not found`);
    }
    if (this._mealEvents().some((event) => event.foodId === id)) {
      return 'in-use';
    }
    this._foods.update((foods) => foods.filter((food) => food.id !== id));
    this.persistData();
    return 'deleted';
  }

  saveDailyFoodPlan(plan: DailyFoodPlan): void {
    const portions = [
      plan.morningGrams,
      plan.afternoonGrams,
      plan.nightGrams,
    ];
    if (
      portions.some(
        (grams) => !Number.isFinite(grams) || grams < 0 || grams > 1000,
      )
    ) {
      throw new Error('Daily food plan portions must be between 0 and 1000 grams');
    }
    this._dailyFoodPlan.set(plan);
    this.persistData();
  }

  saveMealEvent(event: MealEvent): void {
    if (
      !event.id.trim() ||
      event.petId !== this._pet().id ||
      !['meal', 'treat'].includes(event.type) ||
      !this._foods().some((food) => food.id === event.foodId) ||
      !Number.isFinite(event.grams) ||
      event.grams <= 0 ||
      !Number.isFinite(new Date(event.eatenAt).getTime()) ||
      (event.notes !== undefined && typeof event.notes !== 'string') ||
      this._mealEvents().some((existing) => existing.id === event.id)
    ) {
      throw new Error('Meal entry details are invalid');
    }

    this._mealEvents.update((entries) => [...entries, event]);
    this.persistData();
  }

  saveHealthEntry(entry: HealthEntry): void {
    if (
      !['bloodGlucose', 'insulin', 'medication'].includes(entry.type)
    ) {
      throw new Error('Health entry details are invalid');
    }

    const hasValidTime =
      'measuredAt' in entry
        ? Number.isFinite(new Date(entry.measuredAt).getTime())
        : Number.isFinite(new Date(entry.administeredAt).getTime());
    const hasValidDetails =
      entry.type === 'bloodGlucose'
        ? Number.isFinite(entry.valueMgDl) &&
          entry.valueMgDl > 0 &&
          (entry.notes === undefined || typeof entry.notes === 'string')
        : entry.type === 'insulin'
          ? Number.isFinite(entry.doseUnits) &&
            entry.doseUnits > 0 &&
            (entry.notes === undefined || typeof entry.notes === 'string')
          : typeof entry.medicationName === 'string' &&
            Boolean(entry.medicationName.trim()) &&
            Number.isFinite(entry.doseAmount) &&
            entry.doseAmount > 0 &&
            ['mg', 'ml', 'tablet', 'drop', 'other'].includes(entry.doseUnit);

    if (
      !entry.id.trim() ||
      entry.petId !== this._pet().id ||
      !hasValidTime ||
      !hasValidDetails ||
      this._healthEntries().some((existing) => existing.id === entry.id)
    ) {
      throw new Error('Health entry details are invalid');
    }

    this._healthEntries.update((entries) => [...entries, entry]);
    this.persistData();
  }

  private restorePersistedData(): void {
    const saved = this.storage?.getItem(STORAGE_KEY);
    if (saved === null || saved === undefined) {
      return;
    }

    let value: unknown;
    try {
      value = JSON.parse(saved);
    } catch {
      throw new Error('Saved pet data is not valid JSON');
    }

    if (!isPersistedPetData(value)) {
      throw new Error('Saved pet data has an unsupported or invalid format');
    }

    this._pet.set(value.pet);
    this._weightEntries.set(value.weightEntries);
    this._foods.set(value.foods);
    this._dailyFoodPlan.set(value.dailyFoodPlan);
    this._mealEvents.set(value.mealEvents);
    this._healthEntries.set(value.healthEntries);
  }

  private persistData(pet: Pet = this._pet()): void {
    if (!this.storage) {
      return;
    }

    const data: PersistedPetData = {
      version: STORAGE_VERSION,
      pet,
      weightEntries: this._weightEntries(),
      foods: this._foods(),
      dailyFoodPlan: this._dailyFoodPlan(),
      mealEvents: this._mealEvents(),
      healthEntries: this._healthEntries(),
    };
    this.storage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}
