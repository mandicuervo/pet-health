import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';
import { PetData } from './pet-data';

describe('PetData', () => {
  let service: PetData;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 15, 22, 52));
    TestBed.configureTestingModule({});
    service = TestBed.inject(PetData);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose the latest weight, calories consumed today, and calories remaining', () => {
    expect(service.currentWeightKg()).toBe(6);
    expect(service.consumedKcalToday()).toBe(175.5);
    expect(service.remainingKcalToday()).toBe(44.5);
  });
});
