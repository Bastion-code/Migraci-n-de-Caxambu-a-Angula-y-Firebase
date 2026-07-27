import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductoService } from '../../services/producto';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit {
  productoService = inject(ProductoService);
  cdr = inject(ChangeDetectorRef);
  productos: any[] = [];

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos() {
    this.productoService.getProductos().subscribe({
      next: (data) => {
        console.log("PRODUCTOS ASIGNADOS A LA VISTA:", data);
        this.productos = data;
        this.cdr.detectChanges(); // Forzamos a Angular a renderizar las tarjetas
      },
      error: (err) => {
        console.error('Error al cargar los productos:', err);
      }
    });
  }
}