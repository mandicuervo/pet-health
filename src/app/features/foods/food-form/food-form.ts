import { Component, inject, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Food } from '../../../core/models/food.model';
import { PetData } from '../../../core/services/pet-data';

@Component({
  imports: [TranslatePipe],
  selector: 'app-food-form',
  styleUrl: './food-form.scss',
  templateUrl: './food-form.html',
})
export class FoodForm {
  private readonly petData = inject(PetData);

  readonly food = input<Food>();
  readonly saved = output<Food>();
  readonly cancelled = output<void>();
  readonly errorKey = signal<string | undefined>(undefined);

  save(event: Event): void {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || !form.reportValidity()) {
      return;
    }

    const data = new FormData(form);
    const category = String(data.get('category'));
    if (category !== 'dryFood' && category !== 'wetFood' && category !== 'treat') {
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
      const savedFood = this.petData.saveFood(food, this.food()?.id);
      this.errorKey.set(undefined);
      this.saved.emit(savedFood);
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      if (error.message !== 'Food details are invalid') {
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
