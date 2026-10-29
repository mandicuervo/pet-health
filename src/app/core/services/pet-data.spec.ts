import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';
import { PetData } from './pet-data';

describe('PetData', () => {
  let service: PetData;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 15, 17, 0));
    window.localStorage.removeItem('pet-health-data');
    window.localStorage.removeItem('pet-health-setup-complete');
    TestBed.configureTestingModule({});
    service = TestBed.inject(PetData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.removeItem('pet-health-data');
    window.localStorage.removeItem('pet-health-setup-complete');
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should persist the first-setup completion state', () => {
    expect(service.setupComplete()).toBe(false);
    service.completeSetup();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PetData);

    expect(service.setupComplete()).toBe(true);
  });

  it('should persist the pet photo together with the profile', () => {
    const photoUrl = 'data:image/jpeg;base64,cGV0LXBob3Rv';
    service.savePet({ ...service.pet(), photoUrl });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PetData);

    expect(service.pet().photoUrl).toBe(photoUrl);
  });

  it('should not update the in-memory pet when profile persistence fails', () => {
    const originalPet = service.pet();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
    });

    expect(() =>
      service.savePet({ ...originalPet, photoUrl: 'data:image/jpeg;base64,cGV0' }),
    ).toThrow('Storage quota exceeded');
    expect(service.pet()).toEqual(originalPet);
  });

  it("should calculate today's calories and expose the latest weight metrics", () => {
    expect(service.kcalToday()).toBeCloseTo(175.5);
    expect(service.kcalRemainingToday()).toBeCloseTo(74.5);
    expect(service.weightChangeKg()).toBe(-0.4);
    expect(service.currentWeightKg()).toBe(6);
  });

  it('should persist the pet tracking options and health entries', () => {
    service.savePet({
      ...service.pet(),
      conditions: ['diabetes', 'obesity'],
      tracking: ['weight', 'bloodGlucose', 'insulin', 'food', 'medication'],
      profileModes: ['diabetes', 'obesity', 'journal'],
    });
    service.saveHealthEntry({
      id: 'g1',
      petId: service.pet().id,
      type: 'bloodGlucose',
      valueMgDl: 180,
      measuredAt: '2026-10-15T17:00:00',
    });
    service.saveHealthEntry({
      id: 'i1',
      petId: service.pet().id,
      type: 'insulin',
      doseUnits: 1.5,
      administeredAt: '2026-10-15T17:05:00',
    });
    service.saveHealthEntry({
      id: 'm1',
      petId: service.pet().id,
      type: 'medication',
      medicationName: 'Dapa',
      doseAmount: 1,
      doseUnit: 'tablet',
      administeredAt: '2026-10-15T17:10:00',
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PetData);

    expect(service.pet().conditions).toEqual(['diabetes', 'obesity']);
    expect(service.pet().tracking).toContain('bloodGlucose');
    expect(service.pet().profileModes).toEqual([
      'diabetes',
      'obesity',
      'journal',
    ]);
    expect(service.healthEntries()).toHaveLength(3);
    expect(service.healthEntries()[2]).toMatchObject({
      medicationName: 'Dapa',
      doseAmount: 1,
      doseUnit: 'tablet',
    });
    expect(service.weightEntries()).toHaveLength(6);
  });

  it('should persist food diary quantities in grams', () => {
    service.saveMealEvent({
      id: 'm4',
      petId: service.pet().id,
      type: 'meal',
      foodId: 'f1',
      grams: 32,
      eatenAt: '2026-10-15T18:00:00',
      notes: 'Comeu tudo',
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PetData);

    expect(service.mealEvents().at(-1)).toMatchObject({
      grams: 32,
      foodId: 'f1',
      notes: 'Comeu tudo',
    });
  });
});
