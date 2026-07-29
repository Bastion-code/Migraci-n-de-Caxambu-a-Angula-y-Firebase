<<<<<<< Updated upstream
import { Component } from '@angular/core';
=======
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { FIREBASE_AUTH, FIRESTORE } from '../../app.config';
// Importamos doc y updateDoc para poder descontar el stock
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore'; 
>>>>>>> Stashed changes

@Component({
  selector: 'app-tienda',
  imports: [],
  templateUrl: './tienda.html',
  styleUrl: './tienda.css',
})
<<<<<<< Updated upstream
export class Tienda {}
=======
export class Tienda implements OnInit {
  private productoService = inject(ProductoService);
  private auth: Auth = inject(FIREBASE_AUTH);
  private firestore = inject(FIRESTORE);
  
  productos = signal<Producto[]>([]);
  carrito = signal<{ producto: Producto; cantidad: number }[]>([]);
  usuarioActual = signal<User | null>(null);
  
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
      // 1. CREAMOS EL PEDIDO CON ESTADO Y FECHA
      await this.productoService.crearPedido({
        items: this.carrito(),
        clienteEmail: user.email || 'Sin email',
        total: total,
        estado: 'Pendiente', // Agregamos estado inicial
        fechaHora: new Date().toLocaleString() // Agregamos fecha para la vista del Vendedor
      });

      // 2. DESCONTAMOS EL STOCK DE LA BASE DE DATOS
      for (let item of this.carrito()) {
        if (item.producto.id) {
          const productoRef = doc(this.firestore, 'productos', item.producto.id);
          const nuevoStock = item.producto.stock - item.cantidad;
          await updateDoc(productoRef, { stock: nuevoStock });
        }
      }

      alert('¡Pedido enviado con éxito! Quedará a la espera de confirmación por el vendedor.');
      this.carrito.set([]); // Vaciamos el carrito visualmente
    } catch (error) {
      console.error('Error al enviar el pedido:', error);
      alert('Hubo un error al procesar tu pedido.');
    }
  }

  // --- FUNCIÓN PARA GESTIONAR LAS IMÁGENES ---
  obtenerImagenProducto(nombre: string, urlBaseDatos?: string): string {
    const nombreLower = nombre.toLowerCase();
    
    if (nombreLower.includes('caxambu brasilero')) {
      return 'assets/img/cafe-2.png';
    } else if (nombreLower.includes('caxambu colombiano')) {
      return 'assets/img/cafe-1.png'; 
    } else if (nombreLower.includes('flor de brasil tostado')) {
      return 'assets/img/250g-colombiano-brasil.png'; 
    } else if (nombreLower.includes('flor de brasil 85/15')) {
      return 'assets/img/Cafe-Blend.png'; 
    } else if (nombreLower.includes('azúcar') || nombreLower.includes('azucar')) {
      return 'assets/img/Caja-Azucar.png'; 
    } else if (nombreLower.includes('edulco')) {
      return 'assets/img/Caja-Edulco.png'; 
    } else if (nombreLower.includes('leche en polvo')) {
      return 'assets/img/cafe-australiano.jpg'; 
    } else if (nombreLower.includes('chocolate en polvo')) {
      return 'assets/img/Cafe-moka-Brasil.png'; 
    } else if (nombreLower.includes('cafe con leche') || nombreLower.includes('café con leche')) {
      return 'assets/img/cafe-1.png';
    }

    // Imagen por defecto si no coincide ninguna
    return 'assets/img/cafe-1.png';
  }
}
>>>>>>> Stashed changes
