import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto, Resena } from '../../models/producto.model';
import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { FIREBASE_AUTH, FIRESTORE } from '../../app.config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ToastService } from '../../services/toast.service';
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
  private toast = inject(ToastService);

  productos = signal<Producto[]>([]);
  carrito = signal<{ producto: Producto; cantidad: number }[]>([]);
  usuarioActual = signal<User | null>(null);

  historialPedidos = signal<any[]>([]);
  historialAbierto = signal(false);

  mostrarPago = signal(false);
  procesandoPago = signal(false);
  errorPago = signal('');

  // Método de pago elegido
  metodoPagoSeleccionado: 'Mercado Pago' | 'Transferencia' | 'Efectivo' = 'Mercado Pago';

  numeroTarjeta = '';
  vencimiento = '';
  cvv = '';

  // Modal de confirmación exitosa con botón a WhatsApp
  pedidoExitoso = signal<any | null>(null);
  urlWhatsAppPedido = signal<string>('');

  // ==========================================
  // ESTADOS DEL SISTEMA DE RESEÑAS
  // ==========================================
  resenasActuales = signal<Resena[]>([]);
  productoSeleccionadoId = signal<string | null>(null);
  nuevoComentario = signal<string>('');
  nuevaCalificacion = signal<number>(5);

  ngOnInit() {
    this.productoService.getProductos().subscribe(data => {
      this.productos.set(data);
    });

    onAuthStateChanged(this.auth, (user) => {
      this.usuarioActual.set(user);
      if (user && user.email) {
        this.escucharPedidosEnTiempoReal(user.email);
      } else {
        this.historialPedidos.set([]);
      }
    });
  }

  escucharPedidosEnTiempoReal(email: string) {
    const pedidosRef = collection(this.firestore, 'pedidos');
    const q = query(pedidosRef, where('clienteEmail', '==', email));

    onSnapshot(q, (snapshot) => {
      const pedidos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const ordenados = pedidos.sort((a: any, b: any) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });

      this.historialPedidos.set(ordenados);
    }, (error) => {
      console.error('Error al escuchar pedidos en tiempo real:', error);
    });
  }

  toggleHistorial() {
    this.historialAbierto.update(val => !val);
  }

  agregarAlCarrito(producto: Producto) {
    if (producto.stock <= 0) {
      this.toast.error(`"${producto.nombre}" se encuentra temporalmente agotado.`);
      return;
    }

    const itemExistente = this.carrito().find(item => item.producto.id === producto.id);
    const cantidadActual = itemExistente ? itemExistente.cantidad : 0;

    if (cantidadActual + 1 > producto.stock) {
      this.toast.warning(`Solo quedan ${producto.stock} unidades en stock de "${producto.nombre}".`);
      return;
    }

    this.carrito.update(cart => {
      const index = cart.findIndex(item => item.producto.id === producto.id);
      if (index >= 0) {
        cart[index].cantidad++;
        return [...cart];
      }
      return [...cart, { producto, cantidad: 1 }];
    });

    this.toast.success(`"${producto.nombre}" agregado al carrito.`);
  }

  quitarDelCarrito(productoId: string | undefined) {
    this.carrito.update(cart => cart.filter(item => item.producto.id !== productoId));
    this.toast.info('Producto quitado del carrito.');
  }

  abrirPago() {
    const user = this.usuarioActual();
    if (!user) {
      this.toast.warning('Debés iniciar sesión para realizar un pedido.');
      return;
    }
    if (this.carrito().length === 0) {
      this.toast.warning('Tu carrito está vacío.');
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

  cerrarModalExito() {
    this.pedidoExitoso.set(null);
  }

  async confirmarPago() {
    this.errorPago.set('');

    if (this.metodoPagoSeleccionado === 'Mercado Pago') {
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
    }

    this.procesandoPago.set(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    this.procesandoPago.set(false);
    this.mostrarPago.set(false);
    await this.finalizarCompra();
  }

  async finalizarCompra() {
    const user = this.usuarioActual();
    if (!user || !user.email) return;

    try {
      const itemsComprados = [...this.carrito()];
      const metodo = this.metodoPagoSeleccionado;
      
      await this.productoService.finalizarCompra(user.email, itemsComprados, metodo);

      const total = itemsComprados.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
      const numeroCompra = 'CAX-' + Math.floor(1000 + Math.random() * 9000);
      const fechaHora = new Date().toLocaleString('es-AR');

      const pedidoParaPDF = {
        items: itemsComprados,
        clienteEmail: user.email,
        total: total,
        numeroCompra: numeroCompra,
        fechaHora: fechaHora,
        metodoPago: metodo
      };

      // Generar y descargar comprobante PDF
      this.generarComprobantePDF(pedidoParaPDF);

      // Armar mensaje directo para enviar por WhatsApp a Mariano
      const detalleItems = itemsComprados
        .map(i => `  • ${i.producto.nombre} (x${i.cantidad}) - $${i.producto.precio * i.cantidad}`)
        .join('\n');

      const mensajeWhatsApp = `☕ *¡Hola Mariano! Nuevo pedido en Café Caxambú*\n\n🧾 *Orden:* ${numeroCompra}\n👤 *Cliente:* ${user.email}\n💳 *Forma de Pago:* ${metodo}\n📅 *Fecha:* ${fechaHora}\n\n📦 *Detalle de compra:*\n${detalleItems}\n\n💰 *Total Abonado:* $${total}\n\n¡Quedo a la espera de confirmación y entrega!`;

      this.urlWhatsAppPedido.set(`https://wa.me/5492634362734?text=${encodeURIComponent(mensajeWhatsApp)}`);
      this.pedidoExitoso.set(pedidoParaPDF);

      this.toast.success('¡Pedido realizado con éxito! Comprobante PDF descargado.', '¡Operación Exitosa!');
      
      // Limpiar carrito
      this.carrito.set([]);
      this.numeroTarjeta = '';
      this.vencimiento = '';
      this.cvv = '';
    } catch (error: any) {
      console.error('Error al enviar el pedido:', error);
      this.toast.error(`Error al procesar el pedido: ${error.message || error}`);
    }
  }

  generarComprobantePDF(pedido: any) {
    const pdfDoc = new jsPDF();

    pdfDoc.setFontSize(20);
    pdfDoc.text('Café Caxambú', 20, 20);
    pdfDoc.setFontSize(12);
    pdfDoc.text('Comprobante de Compra y Remito Oficial', 20, 28);
    pdfDoc.line(20, 32, 190, 32);

    pdfDoc.text(`Orden: ${pedido.numeroCompra}`, 20, 42);
    pdfDoc.text(`Cliente: ${pedido.clienteEmail}`, 20, 50);
    pdfDoc.text(`Fecha y Hora: ${pedido.fechaHora}`, 20, 58);
    pdfDoc.text(`Método de Pago: ${pedido.metodoPago || 'Mercado Pago'}`, 20, 66);
    pdfDoc.line(20, 72, 190, 72);

    let yPos = 82;
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Producto', 20, yPos);
    pdfDoc.text('Cant.', 120, yPos);
    pdfDoc.text('Precio', 145, yPos);
    pdfDoc.text('Subtotal', 170, yPos);
    pdfDoc.setFont('helvetica', 'normal');

    yPos += 8;
    pedido.items.forEach((item: any) => {
      pdfDoc.text(item.producto.nombre, 20, yPos);
      pdfDoc.text(`${item.cantidad}`, 125, yPos);
      pdfDoc.text(`$${item.producto.precio}`, 145, yPos);
      pdfDoc.text(`$${item.producto.precio * item.cantidad}`, 170, yPos);
      yPos += 8;
    });

    pdfDoc.line(20, yPos + 4, 190, yPos + 4);
    yPos += 14;

    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(14);
    pdfDoc.text(`Total: $${pedido.total}`, 145, yPos);

    pdfDoc.setFontSize(10);
    pdfDoc.setFont('helvetica', 'italic');
    pdfDoc.text('Gracias por elegir Café Caxambú. Mendoza, Argentina.', 20, yPos + 20);

    pdfDoc.save(`Comprobante_${pedido.numeroCompra}.pdf`);
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

  // ==========================================
  // FUNCIONES PARA SISTEMA DE RESEÑAS
  // ==========================================
  verResenas(productoId: string) {
    this.productoSeleccionadoId.set(productoId);
    this.productoService.getResenasPorProducto(productoId).subscribe(resenas => {
      this.resenasActuales.set(resenas);
    });
  }

  async enviarResena() {
    const user = this.usuarioActual();
    const prodId = this.productoSeleccionadoId();

    if (!user) {
      this.toast.warning('Debés iniciar sesión para dejar una reseña.');
      return;
    }

    if (!prodId || this.nuevoComentario().trim() === '') {
      this.toast.warning('Por favor escribí un comentario antes de publicar.');
      return;
    }

    try {
      await this.productoService.crearResena({
        productoId: prodId,
        usuarioEmail: user.email || 'Anónimo',
        comentario: this.nuevoComentario(),
        calificacion: this.nuevaCalificacion()
      });
      
      this.toast.success('¡Reseña publicada con éxito! Gracias por tu opinión.');
      this.nuevoComentario.set('');
      this.nuevaCalificacion.set(5);
    } catch (error) {
      console.error('Error al publicar reseña:', error);
      this.toast.error('Hubo un error al procesar tu reseña.');
    }
  }
}
