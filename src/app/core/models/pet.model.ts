export type NutritionGoal = 'lose' | 'maintain' | 'gain';

export interface Pet {
  id: string;
  name: string;
  species: 'cat' | 'dog';
  breed?: string;
  birthDate: string;
  photoUrl?: string;
  nutritionGoal: NutritionGoal;
  targetWeightKg?: number;
  dailyKcalTarget?: number;
}