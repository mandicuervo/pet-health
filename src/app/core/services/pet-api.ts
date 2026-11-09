import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pet } from '../models/pet.model';

@Injectable({ providedIn: 'root' })
export class PetApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/pets';

  getPets(): Observable<Pet[]> {
    return this.http.get<Pet[]>(this.apiUrl);
  }

  claimLegacyPet(pet: Pet): Observable<Pet> {
    return this.http.post<Pet>(`${this.apiUrl}/claim-legacy`, {
      name: pet.name,
      species: pet.species,
      birthDate: pet.birthDate,
    });
  }

  getAuthenticatedUser(): Observable<{ uid: string }> {
    return this.http.get<{ uid: string }>('/api/auth/me');
  }

  createPet(pet: Pet): Observable<Pet> {
    const { id: _id, ...petData } = pet;
    return this.http.post<Pet>(this.apiUrl, petData);
  }

  updatePet(pet: Pet): Observable<Pet> {
    const { id, ...petData } = pet;
    return this.http.put<Pet>(`${this.apiUrl}/${encodeURIComponent(id)}`, petData);
  }
}
