import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CoffeeService, CoffeeDrink } from '../../services/coffee.service';

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './recetas.html',
  styleUrl: './recetas.css'
})
export class Recetas implements OnInit {
  private coffeeService = inject(CoffeeService);

  searchControl = new FormControl('');
  allCoffees: CoffeeDrink[] = [];
  filteredCoffees: CoffeeDrink[] = [];
  cargando = true;
  error = false;

  ngOnInit() {
    this.coffeeService.getCoffees().subscribe({
      next: (coffees) => {
        this.allCoffees = coffees;
        this.filteredCoffees = coffees.slice(0, 12);
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      }
    });

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      const searchTerm = (query || '').toLowerCase();
      this.filteredCoffees = this.allCoffees.filter(coffee =>
        coffee.title.toLowerCase().includes(searchTerm) ||
        coffee.ingredients?.some(i => i.toLowerCase().includes(searchTerm))
      ).slice(0, 12);
    });
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = '/assets/img/gallery1.jpg';
  }
}