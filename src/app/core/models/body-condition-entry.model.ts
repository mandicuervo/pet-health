export type BodyConditionScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface BodyConditionEntry {
  id: string;
  petId: string;
  date: string;
  score: BodyConditionScore;
}