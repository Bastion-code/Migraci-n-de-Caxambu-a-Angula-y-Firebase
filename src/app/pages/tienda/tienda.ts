import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { FIREBASE_AUTH, FIRESTORE } from '../../app.config';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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

  // ---  estado del checkout con pago simulado ---
  mostrarPago = signal(false);
  procesandoPago = signal(false);
  errorPago = signal('');
  numeroTarjeta = '';
  vencimiento = '';
  cvv = '';

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

  abrirPago() {
    const user = this.usuarioActual();
    if (!user) {
      alert('Debes iniciar sesión para realizar un pedido.');
      return;
    }
    if (this.carrito().length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }
    this.errorPago.set('');
    this.mostrarPago.set(true);
  }

  cerrarPago() {
    this.mostrarPago.set(false);
    this.numeroTarjeta = '';
    this.vencimiento = '';
    this.cvv = '';
    this.errorPago.set('');
  }

  async confirmarPago() {
    this.errorPago.set('');

    const numeroLimpio = this.numeroTarjeta.replace(/\s/g, '');
    if (!/^\d{16}$/.test(numeroLimpio)) {
      this.errorPago.set('El número de tarjeta debe tener 16 dígitos.');
      return;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(this.vencimiento)) {
      this.errorPago.set('El vencimiento debe tener formato MM/AA.');
      return;
    } else {
      const [mes, anio] = this.vencimiento.split('/').map(Number);
      const fechaVenc = new Date(2000 + anio, mes);
      if (fechaVenc < new Date()) {
        this.errorPago.set('La tarjeta está vencida.');
        return;
      }
    }

    if (!/^\d{3}$/.test(this.cvv)) {
      this.errorPago.set('El CVV debe tener 3 dígitos.');
      return;
    }

    this.procesandoPago.set(true);

    // Simulamos el tiempo de procesamiento del pago
    await new Promise(resolve => setTimeout(resolve, 1500));

    this.procesandoPago.set(false);
    this.mostrarPago.set(false);
    await this.finalizarCompra();
  }

  async finalizarCompra() {
    const user = this.usuarioActual();
    if (!user) return;

    const total = this.carrito().reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
    const numeroCompra = 'CAX-' + Math.floor(1000 + Math.random() * 9000);
    const fechaHora = new Date().toLocaleString('es-AR');

    const pedido = {
      items: this.carrito(),
      clienteEmail: user.email || 'Sin email',
      total: total,
      numeroCompra: numeroCompra,
      fechaHora: fechaHora,
      estado: 'pendiente'
    };


    try {
      await this.productoService.crearPedido(pedido);
      this.generarComprobantePDF(pedido);
      alert('¡Pago aprobado! Tu pedido quedó a la espera de confirmación por el vendedor.');
      this.carrito.set([]);
      this.numeroTarjeta = '';
      this.vencimiento = '';
      this.cvv = '';
    } catch (error) {
      console.error('Error al enviar el pedido:', error);
      alert('Hubo un error al procesar tu pedido.');
    }
  }

  generarComprobantePDF(pedido: any) {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Café Caxambú', 20, 20);
    doc.setFontSize(12);
    doc.text('Comprobante de Compra', 20, 30);

    doc.setFontSize(10);
    doc.text(`Orden: ${pedido.numeroCompra}`, 20, 45);
    doc.text(`Fecha: ${pedido.fechaHora}`, 20, 52);
    doc.text(`Cliente: ${pedido.clienteEmail}`, 20, 59);

    let y = 75;
    doc.setFontSize(11);
    doc.text('Producto', 20, y);
    doc.text('Cant.', 120, y);
    doc.text('Subtotal', 150, y);
    y += 5;
    doc.line(20, y, 190, y);
    y += 8;

    pedido.items.forEach((item: any) => {
      doc.text(item.producto.nombre, 20, y);
      doc.text(String(item.cantidad), 120, y);
      doc.text(`$${item.producto.precio * item.cantidad}`, 150, y);
      y += 8;
    });

    y += 5;
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFontSize(13);
    doc.text(`Total: $${pedido.total}`, 20, y);

    doc.save(`comprobante-${pedido.numeroCompra}.pdf`);
  }
}