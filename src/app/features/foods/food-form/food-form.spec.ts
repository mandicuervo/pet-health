import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { afterEach } from 'vitest';
import { Food } from '../../../core/models/food.model';
import { PetData } from '../../../core/services/pet-data';
import { FoodForm } from './food-form';

describe('FoodForm', () => {
  beforeEach(() => {
    window.localStorage.removeItem('pet-health-data');
    TestBed.configureTestingModule({
      imports: [FoodForm],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    window.localStorage.removeItem('pet-health-data');
  });

  it('saves a food and emits the created food for the caller to use', () => {
    const fixture = TestBed.createComponent(FoodForm);
    let savedFood: Food | undefined;
    fixture.componentInstance.saved.subscribe((food) => (savedFood = food));
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    (form.elements.namedItem('name') as HTMLInputElement).value = 'New food';
    (form.elements.namedItem('brand') as HTMLInputElement).value = 'Brand';
    (form.elements.namedItem('category') as HTMLSelectElement).value = 'wetFood';
    (form.elements.namedItem('kcalPer100g') as HTMLInputElement).value = '90';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(savedFood).toMatchObject({
      name: 'New food',
      brand: 'Brand',
      category: 'wetFood',
      kcalPerKg: 900,
    });
    expect(TestBed.inject(PetData).foods().at(-1)).toEqual(savedFood);
  });
});
