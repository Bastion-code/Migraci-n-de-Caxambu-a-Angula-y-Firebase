import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { FIREBASE_AUTH, FIRESTORE } from '../../app.config';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tienda.html',
  styleUrl: './tienda.css'
})
export class Tienda implements OnInit {
  private productoService = inject(ProductoService);
  private auth: Auth = inject(FIREBASE_AUTH);
  private firestore = inject(FIRESTORE);

  productos = signal<Producto[]>([]);
  carrito = signal<{ producto: Producto; cantidad: number }[]>([]);
  usuarioActual = signal<User | null>(null);
  
  // Historial de pedidos y estado de la ventana desplegable
  historialPedidos = signal<any[]>([]);
  historialAbierto = signal(false);

  ngOnInit() {
    this.productoService.getProductos().subscribe(data => {
      this.productos.set(data);
    });

    onAuthStateChanged(this.auth, (user) => {
      this.usuarioActual.set(user);
      if (user && user.email) {
        this.cargarHistorial(user.email);
      }
    });
  }

  cargarHistorial(email: string) {
    const pedidosRef = collection(this.firestore, 'pedidos');
    const q = query(pedidosRef, where('clienteEmail', '==', email));
    
    onSnapshot(q, (snapshot) => {
      const pedidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.historialPedidos.set(pedidos);
    });
  }

  toggleHistorial() {
    this.historialAbierto.update(val => !val);
  }

  agregarAlCarrito(producto: Producto) {
    this.carrito.update(cart => {
      const index = cart.findIndex(item => item.producto.id === producto.id);
      if (index >= 0) {
        cart[index].cantidad++;
        return [...cart];
      }
      return [...cart, { producto, cantidad: 1 }];
    });
  }

  async finalizarCompra() {
    const user = this.usuarioActual();
    if (!user) {
      alert('Debes iniciar sesión para realizar un pedido.');
      return;
    }

    if (this.carrito().length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    const total = this.carrito().reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);

    try {
      await this.productoService.crearPedido({
        items: this.carrito(),
        clienteEmail: user.email || 'Sin email',
        total: total
      });
      alert('¡Pedido enviado con éxito! Quedará a la espera de confirmación por el vendedor.');
      this.carrito.set([]);
    } catch (error) {
      console.error('Error al enviar el pedido:', error);
      alert('Hubo un error al procesar tu pedido.');
    }
  }
}