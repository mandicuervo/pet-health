import { TestBed } from '@angular/core/testing';
import { PetData } from './pet-data';

describe('PetData', () => {
  let service: PetData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PetData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
