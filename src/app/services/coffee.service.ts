import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CoffeeDrink {
  title: string;
  description: string;
  ingredients: string[];
  image: string;
  id: number;
}

@Injectable({ providedIn: 'root' })
export class CoffeeService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.sampleapis.com/coffee/hot';

  getCoffees(): Observable<CoffeeDrink[]> {
    return this.http.get<CoffeeDrink[]>(this.apiUrl);
  }
}