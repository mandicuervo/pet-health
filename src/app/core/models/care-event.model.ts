export type CareEventType = 'medication' | 'meal';

export interface CareEvent {
  id: string;
  petId: string;
  type: CareEventType;
  title: string;
  scheduledTime: string;
  quantity: number;
  unit: string;
  completedAt?: string;
}