import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DailyFoodPlan, Food } from '../../../core/models/food.model';
import { PetData } from '../../../core/services/pet-data';

@Component({
  imports: [DecimalPipe, TranslatePipe],
  selector: 'app-foods-page',
  styleUrl: './foods-page.scss',
  templateUrl: './foods-page.html',
})
export class FoodsPage {
  private readonly petData = inject(PetData);

  readonly pet = this.petData.pet;
  readonly dailyPlan = this.petData.dailyFoodPlan;
  readonly searchOpen = signal(false);
  readonly searchQuery = signal('');
  readonly editingPlan = signal(false);
  readonly foodFormOpen = signal(false);
  readonly foodFormItem = signal<Food | undefined>(undefined);
  readonly openMenuId = signal<string | undefined>(undefined);
  readonly pendingDelete = signal<Food | undefined>(undefined);
  readonly errorKey = signal<string | undefined>(undefined);
  readonly foods = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    const foods = this.petData.foods();
    if (!query) {
      return foods;
    }
    return foods.filter((food) =>
      `${food.name} ${food.brand ?? ''}`.toLocaleLowerCase().includes(query),
    );
  });
  readonly lifeStageKey = computed(() => {
    const birthDate = new Date(`${this.pet().birthDate}T00:00:00`);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const birthdayHasPassed =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());
    if (!birthdayHasPassed) {
      age -= 1;
    }
    const seniorAge = this.pet().species === 'cat' ? 11 : 7;
    return age < 1
      ? 'foods.junior'
      : age >= seniorAge
        ? 'foods.senior'
        : 'foods.adult';
  });

  toggleSearch(): void {
    this.searchOpen.update((open) => !open);
    if (!this.searchOpen()) {
      this.searchQuery.set('');
    }
  }

  updateSearch(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      throw new Error('Food search event did not originate from an input element');
    }
    this.searchQuery.set(target.value);
  }

  togglePlanForm(): void {
    this.editingPlan.update((editing) => !editing);
    this.errorKey.set(undefined);
  }

  savePlan(event: Event): void {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || !form.reportValidity()) {
      return;
    }
    const data = new FormData(form);
    const plan: DailyFoodPlan = {
      morningGrams: Number(data.get('morning')),
      afternoonGrams: Number(data.get('afternoon')),
      nightGrams: Number(data.get('night')),
    };
    this.petData.saveDailyFoodPlan(plan);
    this.editingPlan.set(false);
  }

  openFoodForm(food?: Food): void {
    this.foodFormItem.set(food);
    this.foodFormOpen.set(true);
    this.openMenuId.set(undefined);
    this.errorKey.set(undefined);
  }

  closeFoodForm(): void {
    this.foodFormOpen.set(false);
    this.foodFormItem.set(undefined);
    this.errorKey.set(undefined);
  }

  toggleFoodMenu(id: string): void {
    this.openMenuId.update((openId) => (openId === id ? undefined : id));
  }

  requestDelete(food: Food): void {
    this.pendingDelete.set(food);
    this.openMenuId.set(undefined);
    this.errorKey.set(undefined);
  }

  cancelDelete(): void {
    this.pendingDelete.set(undefined);
  }

  confirmDelete(): void {
    const food = this.pendingDelete();
    if (!food) {
      throw new Error('No food is selected for deletion');
    }
    const result = this.petData.deleteFood(food.id);
    if (result === 'in-use') {
      this.errorKey.set('foods.deleteInUse');
      this.pendingDelete.set(undefined);
      return;
    }
    this.pendingDelete.set(undefined);
  }

  saveFood(event: Event): void {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || !form.reportValidity()) {
      return;
    }
    const data = new FormData(form);
    const category = String(data.get('category'));
    if (
      category !== 'dryFood' &&
      category !== 'wetFood' &&
      category !== 'treat'
    ) {
      throw new Error(`Unsupported food category: ${category}`);
    }
    const food: Omit<Food, 'id'> = {
      name: String(data.get('name')),
      brand: String(data.get('brand')),
      category,
      kcalPerKg: Number(data.get('kcalPer100g')) * 10,
      ...(this.optionalNumber(data.get('kcalPerUnit')) !== undefined
        ? { kcalPerUnit: this.optionalNumber(data.get('kcalPerUnit')) }
        : {}),
      ...(this.optionalNumber(data.get('fiberPercent')) !== undefined
        ? { fiberPercent: this.optionalNumber(data.get('fiberPercent')) }
        : {}),
      ...(this.optionalNumber(data.get('proteinPercent')) !== undefined
        ? { proteinPercent: this.optionalNumber(data.get('proteinPercent')) }
        : {}),
    };

    try {
      this.petData.saveFood(food, this.foodFormItem()?.id);
      this.closeFoodForm();
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      this.errorKey.set('foods.invalidFood');
    }
  }

  private optionalNumber(value: FormDataEntryValue | null): number | undefined {
    if (value === null || value === '') {
      return undefined;
    }
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
  }
}
