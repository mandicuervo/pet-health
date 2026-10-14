export type HealthCondition = 'diabetes' | 'obesity';

export interface Pet {
  id: string;
  name: string;
  species: 'cat' | 'dog';
  breed?: string;
  ageYears: number;
  weightKg: number;
  photoUrl?: string;
  healthConditions: HealthCondition[];
}