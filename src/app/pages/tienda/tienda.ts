import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { FIREBASE_AUTH, FIRESTORE } from '../../app.config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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

  historialPedidos = signal<any[]>([]);
  historialAbierto = signal(false);

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
      const pedidos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
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
    await new Promise(resolve => setTimeout(resolve, 1500));
    this.procesandoPago.set(false);
    this.mostrarPago.set(false);
    await this.finalizarCompra();
  }

  async finalizarCompra() {
    const user = this.usuarioActual();
    if (!user || !user.email) return;

    try {
      // Llamamos al método transaccional del servicio
      await this.productoService.finalizarCompra(user.email, this.carrito());

      const total = this.carrito().reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
      const numeroCompra = 'CAX-' + Math.floor(1000 + Math.random() * 9000);
      const fechaHora = new Date().toLocaleString('es-AR');

      const pedidoParaPDF = {
        items: this.carrito(),
        clienteEmail: user.email,
        total: total,
        numeroCompra: numeroCompra,
        fechaHora: fechaHora
      };

      this.generarComprobantePDF(pedidoParaPDF);
      alert('¡Pago aprobado! Tu pedido quedó a la espera de confirmación por el vendedor.');
      this.carrito.set([]);
      this.numeroTarjeta = '';
      this.vencimiento = '';
      this.cvv = '';
    } catch (error: any) {
      console.error('Error al enviar el pedido:', error);
      alert(`Hubo un error al procesar tu pedido: ${error.message || error}`);
    }
  }

  generarComprobantePDF(pedido: any) {
    const pdfDoc = new jsPDF();

    pdfDoc.setFontSize(20);
    pdfDoc.text('Café Caxambú', 20, 20);
    pdfDoc.setFontSize(12);
    pdfDoc.text('Comprobante de Compra', 20, 30);

    pdfDoc.setFontSize(10);
    pdfDoc.text(`Orden: ${pedido.numeroCompra}`, 20, 45);
    pdfDoc.text(`Fecha: ${pedido.fechaHora}`, 20, 52);
    pdfDoc.text(`Cliente: ${pedido.clienteEmail}`, 20, 59);

    let y = 75;
    pdfDoc.setFontSize(11);
    pdfDoc.text('Producto', 20, y);
    pdfDoc.text('Cant.', 120, y);
    pdfDoc.text('Subtotal', 150, y);
    y += 5;
    pdfDoc.line(20, y, 190, y);
    y += 8;

    pedido.items.forEach((item: any) => {
      pdfDoc.text(item.producto.nombre, 20, y);
      pdfDoc.text(String(item.cantidad), 120, y);
      pdfDoc.text(`$${item.producto.precio * item.cantidad}`, 150, y);
      y += 8;
    });

    y += 5;
    pdfDoc.line(20, y, 190, y);
    y += 10;
    pdfDoc.setFontSize(13);
    pdfDoc.text(`Total: $${pedido.total}`, 20, y);

    pdfDoc.save(`comprobante-${pedido.numeroCompra}.pdf`);
  }

  obtenerImagenProducto(nombre: string, urlBaseDatos?: string): string {
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