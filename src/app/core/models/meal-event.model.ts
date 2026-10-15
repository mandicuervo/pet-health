export type MealEventType = 'meal' | 'treat';

export interface MealEvent {
  id: string;
  petId: string;
  type: MealEventType;
  foodId: string;
  grams: number;
  eatenAt: string;
}
