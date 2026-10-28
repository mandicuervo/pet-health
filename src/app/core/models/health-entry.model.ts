export interface BloodGlucoseEntry {
  id: string;
  petId: string;
  type: 'bloodGlucose';
  valueMgDl: number;
  measuredAt: string;
  notes?: string;
}

export interface InsulinEntry {
  id: string;
  petId: string;
  type: 'insulin';
  doseUnits: number;
  administeredAt: string;
  notes?: string;
}

export type MedicationDoseUnit = 'mg' | 'ml' | 'tablet' | 'drop' | 'other';

export interface MedicationEntry {
  id: string;
  petId: string;
  type: 'medication';
  medicationName: string;
  doseAmount: number;
  doseUnit: MedicationDoseUnit;
  administeredAt: string;
  notes?: string;
}

export type HealthEntry =
  | BloodGlucoseEntry
  | InsulinEntry
  | MedicationEntry;
