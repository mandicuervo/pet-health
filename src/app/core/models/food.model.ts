export type FoodCategory = 'dryFood' | 'wetFood' | 'treat';

export interface Food {
  id: string;
  name: string;
  kcalPerKg: number;
  category: FoodCategory;
}
