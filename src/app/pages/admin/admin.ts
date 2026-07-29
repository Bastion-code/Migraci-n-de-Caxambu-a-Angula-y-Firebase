import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  private productoService = inject(ProductoService);
  private router = inject(Router);

  productos = signal<Producto[]>([]);
  pedidos = signal<any[]>([]);

  // Variables para la nueva fila de inventario
  nuevoNombre: string = '';
  nuevoStock: number = 0;
  nuevoPrecio: number = 0;

  ngOnInit() {
    this.cargarDatosAdmin();
  }

  cargarDatosAdmin() {
    // Cargar inventario de productos en tiempo real
    this.productoService.getProductos().subscribe(data => {
      this.productos.set(data);
    });

    // Cargar pedidos en tiempo real desde el servicio unificado
    this.productoService.getPedidos().subscribe(data => {
      const ordenados = data.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      this.pedidos.set(ordenados);
    });
  }

  async guardarProducto(producto: Producto) {
    if (!producto.id) return;
    try {
      await this.productoService.actualizarProducto(producto.id, {
        precio: producto.precio,
        stock: producto.stock
      });
      alert('¡Producto actualizado con éxito!');
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      alert('Hubo un error al actualizar el producto.');
    }
  }

  async agregarNuevoProducto() {
    if (!this.nuevoNombre || this.nuevoPrecio <= 0) {
      alert('Por favor, ingresá al menos el nombre y un precio válido para el nuevo producto.');
      return;
    }
    try {
      await this.productoService.crearProducto({
        nombre: this.nuevoNombre,
        stock: this.nuevoStock,
        precio: this.nuevoPrecio
      } as any);
      alert('¡Producto agregado con éxito al inventario!');

      this.nuevoNombre = '';
      this.nuevoStock = 0;
      this.nuevoPrecio = 0;
    } catch (error) {
      console.error('Error al agregar el producto:', error);
      alert('Hubo un error al intentar agregar el producto.');
    }
  }

  async cambiarEstadoPedido(pedidoId: string, nuevoEstado: string) {
    try {
      if (nuevoEstado === 'confirmado') {
        await this.productoService.aprobarPedido(pedidoId);
        alert('Pedido confirmado con éxito.');
      } else if (nuevoEstado === 'cancelado') {
        await this.productoService.rechazarPedido(pedidoId);
        alert('Pedido cancelado y stock devuelto al inventario con éxito.');
      }
    } catch (error) {
      console.error('Error al cambiar estado del pedido:', error);
      alert('No se pudo actualizar el estado del pedido.');
    }
  }

  async eliminarProducto(id: string | undefined) {
    if (!id) return;

    const confirmar = confirm('¿Estás seguro de que querés eliminar este producto de la tienda?');
    if (!confirmar) return;

    try {
      await this.productoService.eliminarProducto(id);
      alert('¡Producto eliminado con éxito!');
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
      alert('Hubo un error al intentar eliminar el producto.');
    }
  }
}