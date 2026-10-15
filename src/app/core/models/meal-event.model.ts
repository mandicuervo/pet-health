export type MealEventType = 'meal';

export interface MealEvent {
  id: string;
  petId: string;
  type: MealEventType;
  foodId: string;
  grams: number;
  scheduledTime: string;
  completedAt?: string;
}
