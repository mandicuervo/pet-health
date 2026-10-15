import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';
import { PetData } from './pet-data';

describe('PetData', () => {
  let service: PetData;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 15, 17, 0));
    TestBed.configureTestingModule({});
    service = TestBed.inject(PetData);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it("should calculate today's calories and expose the latest weight metrics", () => {
    expect(service.kcalToday()).toBeCloseTo(175.5);
    expect(service.kcalRemainingToday()).toBeCloseTo(74.5);
    expect(service.weightChangeKg()).toBe(-0.4);
    expect(service.currentWeightKg()).toBe(6);
  });
});
