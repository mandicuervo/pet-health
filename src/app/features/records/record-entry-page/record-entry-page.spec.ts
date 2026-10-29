import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { afterEach } from 'vitest';
import { PetData } from '../../../core/services/pet-data';
import { RecordEntryPage } from './record-entry-page';

describe('RecordEntryPage', () => {
  beforeEach(() => {
    window.localStorage.removeItem('pet-health-data');
    TestBed.configureTestingModule({
      imports: [RecordEntryPage],
      providers: [provideRouter([]), provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    window.localStorage.removeItem('pet-health-data');
  });

  it('uses the shared food form for the food tab', () => {
    const fixture = TestBed.createComponent(RecordEntryPage);
    fixture.detectChanges();
    const foodForm = fixture.nativeElement.querySelector('app-food-form');
    expect(foodForm).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.form-card')).toBeNull();

    const form = foodForm.querySelector('form') as HTMLFormElement;
    (form.elements.namedItem('name') as HTMLInputElement).value = 'New food';
    (form.elements.namedItem('kcalPer100g') as HTMLInputElement).value = '320';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(TestBed.inject(PetData).foods().at(-1)?.name).toBe('New food');
    expect(fixture.componentInstance.successKey()).toBe('records.foodSaved');
  });
});
