import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { afterEach, vi } from 'vitest';
import { PetData } from '../../../core/services/pet-data';
import { FoodDiaryPage } from './food-diary-page';

describe('FoodDiaryPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 15, 17, 0));
    window.localStorage.removeItem('pet-health-data');
    TestBed.configureTestingModule({
      imports: [FoodDiaryPage],
      providers: [provideRouter([]), provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    window.localStorage.removeItem('pet-health-data');
    vi.useRealTimers();
  });

  it('shows recent food, health, and weight entries newest first', () => {
    const petData = TestBed.inject(PetData);
    petData.saveHealthEntry({
      id: 'glucose',
      petId: petData.pet().id,
      type: 'bloodGlucose',
      valueMgDl: 180,
      measuredAt: '2026-10-15T08:00:00',
    });
    petData.saveHealthEntry({
      id: 'insulin',
      petId: petData.pet().id,
      type: 'insulin',
      doseUnits: 1.5,
      administeredAt: '2026-10-15T08:15:00',
    });
    petData.saveHealthEntry({
      id: 'medication',
      petId: petData.pet().id,
      type: 'medication',
      medicationName: 'Medication A',
      doseAmount: 1,
      doseUnit: 'tablet',
      administeredAt: '2026-10-15T08:30:00',
    });

    const fixture = TestBed.createComponent(FoodDiaryPage);
    fixture.detectChanges();

    expect(fixture.componentInstance.filteredRecords().map((record) => record.id)).toEqual([
      'm3',
      'm2',
      'w6',
      'medication',
      'insulin',
      'glucose',
      'm1',
    ]);
    fixture.componentInstance.selectFilter('bloodGlucose');
    fixture.detectChanges();
    expect(fixture.componentInstance.filteredRecords().map((record) => record.id)).toEqual([
      'glucose',
    ]);
    expect(fixture.nativeElement.querySelector('.trend-chart')).toBeTruthy();
    fixture.componentInstance.setTrendPeriod('week');
    expect(fixture.componentInstance.glucosePoints().map((point) => point.value)).toContain(180);
    fixture.componentInstance.selectFilter('weight');
    fixture.detectChanges();
    expect(fixture.componentInstance.weightPoints().some((point) => point.value !== undefined)).toBe(
      true,
    );
    expect(fixture.nativeElement.querySelector('.weight-trend-chart')).toBeTruthy();
    fixture.componentInstance.selectFilter('food');
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedDayCalories()).toBeGreaterThan(0);
    expect(fixture.componentInstance.calorieProgress()).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('.progress-track')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.trend-chart')).toBeNull();
    expect(
      fixture.componentInstance.weekDates().find((date) => date.key === '2026-10-15')?.hasRecords,
    ).toBe(true);
  });
});
