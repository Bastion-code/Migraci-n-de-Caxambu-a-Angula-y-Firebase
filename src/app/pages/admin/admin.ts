import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { FIRESTORE, FIREBASE_AUTH } from '../../app.config';
import { collection, collectionData } from 'rxfire/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  private productoService = inject(ProductoService);
  private firestore: Firestore = inject(FIRESTORE);
  private auth: Auth = inject(FIREBASE_AUTH);
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
    this.productoService.getProductos().subscribe(data => {
      this.productos.set(data);
    });

    const pedidosRef = (collection as any)(this.firestore, 'pedidos');
    (collectionData(pedidosRef, { idField: 'id' }) as Observable<any[]>).subscribe(data => {
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
      
      // Limpiamos los campos de la fila inferior
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
      const pedidoRef = doc(this.firestore, 'pedidos', pedidoId);
      await updateDoc(pedidoRef, { estado: nuevoEstado });
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