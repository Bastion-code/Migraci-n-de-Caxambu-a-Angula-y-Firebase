import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductoService } from '../../services/producto';
import { CoffeeService, CoffeeDrink } from '../../services/coffee.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit {
  productoService = inject(ProductoService);
  coffeeService = inject(CoffeeService);
  cdr = inject(ChangeDetectorRef);
  productos: any[] = [];
  recetasPreview: CoffeeDrink[] = [];

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarRecetasPreview();
  }

  cargarProductos() {
    this.productoService.getProductos().subscribe({
      next: (data) => {
        console.log("PRODUCTOS ASIGNADOS A LA VISTA:", data);
        this.productos = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar los productos:', err);
      }
    });
  }
  

  cargarRecetasPreview() {
    this.coffeeService.getCoffees().subscribe({
      next: (data) => {
        this.recetasPreview = data.slice(0, 3);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar recetas:', err);
      }
    });
  }
onImageError(event: Event) {
  (event.target as HTMLImageElement).src = '/assets/img/gallery1.jpg';
}

obtenerImagenProducto(nombre: string): string {
  const nombreLower = nombre.toLowerCase();

  if (nombreLower.includes('caxambu brasilero')) {
    return 'assets/img/cafe-2.png';
  } else if (nombreLower.includes('caxambu colombiano')) {
    return 'assets/img/cafe-1.png';
  } else if (nombreLower.includes('flor de brasil tostado')) {
    return 'assets/img/Cafe-Blend.png';
  } else if (nombreLower.includes('flor de brasil 85/15')) {
    return 'assets/img/Cafe-Blend.png';
  } else if (nombreLower.includes('azúcar') || nombreLower.includes('azucar')) {
    return 'assets/img/Caja-Azucar.png';
  } else if (nombreLower.includes('edulco')) {
    return 'assets/img/Caja-Edulco.png';
  } else if (nombreLower.includes('leche en polvo')) {
    return 'assets/img/250g-colombiano-brasil.png';
  } else if (nombreLower.includes('chocolate en polvo')) {
    return 'assets/img/250g-colombiano-brasil.png';
  } else if (nombreLower.includes('cafe con leche') || nombreLower.includes('café con leche')) {
    return 'assets/img/cafe-1.png';
  }

  return 'assets/img/250g-colombiano-brasil.png';
}
}