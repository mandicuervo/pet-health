export type FoodCategory = 'dryFood' | 'wetFood' | 'treat';

export interface Food {
  id: string;
  name: string;
  brand?: string;
  kcalPerKg: number;
  kcalPerUnit?: number;
  fiberPercent?: number;
  proteinPercent?: number;
  category: FoodCategory;
}

export interface DailyFoodPlan {
  morningGrams: number;
  afternoonGrams: number;
  nightGrams: number;
}
