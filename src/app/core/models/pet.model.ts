export type NutritionGoal = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'low' | 'moderate' | 'high';
export type PetCondition = 'obesity' | 'diabetes' | 'other';
export type PetTracking =
  | 'weight'
  | 'bloodGlucose'
  | 'insulin'
  | 'food'
  | 'medication';
export type PetProfileMode = 'diabetes' | 'obesity' | 'journal';

export interface Pet {
  id: string;
  name: string;
  species: 'cat' | 'dog';
  breed?: string;
  birthDate: string;
  photoUrl?: string;
  activityLevel?: ActivityLevel;
  nutritionGoal: NutritionGoal;
  targetWeightKg?: number;
  dailyKcalTarget?: number;
  conditions: PetCondition[];
  tracking: PetTracking[];
  profileModes?: PetProfileMode[];
}