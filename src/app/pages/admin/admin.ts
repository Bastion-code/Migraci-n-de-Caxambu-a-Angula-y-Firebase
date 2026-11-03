import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { ToastService } from '../../services/toast.service';

export interface GrupoDiaVentas {
  fechaKey: string;
  diaSemana: string;
  fechaTexto: string;
  totalVentasDia: number;
  totalGananciaDia: number;
  pedidos: any[];
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  private productoService = inject(ProductoService);
  private toast = inject(ToastService);

  productos = signal<Producto[]>([]);
  pedidos = signal<any[]>([]);

  // Filtro para el historial de pedidos
  filtroHistorial = signal<'todos' | 'confirmado' | 'cancelado'>('todos');

  // Filtro adicional por método de pago
  filtroMetodoPago = signal<'todos' | 'Mercado Pago' | 'Transferencia' | 'Efectivo'>('todos');

  // Estado para el modal de eliminación de pedido
  pedidoAEliminar = signal<any | null>(null);
  eliminandoPedido = signal<boolean>(false);

  // Variables para la nueva fila de inventario
  nuevoNombre: string = '';
  nuevoStock: number = 0;
  nuevoCosto: number = 0;
  nuevoPrecio: number = 0;

  // ==========================================
  // MÉTRICAS EJECUTIVAS (KPIs)
  // ==========================================
  pedidosPendientes = computed(() => {
    return this.pedidos().filter(p => p.estado === 'pendiente' || p.estado === 'PENDIENTE');
  });

  totalVentasConfirmadas = computed(() => {
    return this.pedidos()
      .filter(p => p.estado === 'confirmado')
      .reduce((acc, p) => acc + (p.total || 0), 0);
  });

  totalGananciaConfirmada = computed(() => {
    return this.pedidos()
      .filter(p => p.estado === 'confirmado')
      .reduce((acc, p) => acc + this.calcularGananciaPedido(p), 0);
  });

  totalVentasMP = computed(() => {
    return this.pedidos()
      .filter(p => p.estado === 'confirmado' && this.obtenerMetodoPago(p) === 'Mercado Pago')
      .reduce((acc, p) => acc + (p.total || 0), 0);
  });

  totalVentasTransferencia = computed(() => {
    return this.pedidos()
      .filter(p => p.estado === 'confirmado' && this.obtenerMetodoPago(p) === 'Transferencia')
      .reduce((acc, p) => acc + (p.total || 0), 0);
  });

  totalVentasEfectivo = computed(() => {
    return this.pedidos()
      .filter(p => p.estado === 'confirmado' && this.obtenerMetodoPago(p) === 'Efectivo')
      .reduce((acc, p) => acc + (p.total || 0), 0);
  });

  productosBajoStock = computed(() => {
    return this.productos().filter(p => p.stock <= 3);
  });

  pedidosFiltrados = computed(() => {
    const filtroEstado = this.filtroHistorial();
    const filtroMetodo = this.filtroMetodoPago();
    const noPendientes = this.pedidos().filter(p => p.estado !== 'pendiente' && p.estado !== 'PENDIENTE');
    
    return noPendientes.filter(p => {
      const coincideEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
      const coincideMetodo = filtroMetodo === 'todos' || this.obtenerMetodoPago(p) === filtroMetodo;
      return coincideEstado && coincideMetodo;
    });
  });

  // ==========================================
  // AGRUPACIÓN POR DÍA Y DÍA DE LA SEMANA
  // ==========================================
  gruposVentasPorDia = computed<GrupoDiaVentas[]>(() => {
    const pedidos = this.pedidosFiltrados();
    const gruposMap = new Map<string, GrupoDiaVentas>();

    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    pedidos.forEach(pedido => {
      const d = this.obtenerFechaPedido(pedido);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const fechaKey = `${yyyy}-${mm}-${dd}`;

      if (!gruposMap.has(fechaKey)) {
        const nombreDia = diasSemana[d.getDay()];
        const fechaTexto = `${nombreDia} ${d.getDate()} de ${meses[d.getMonth()]}, ${yyyy}`;
        
        gruposMap.set(fechaKey, {
          fechaKey,
          diaSemana: nombreDia,
          fechaTexto,
          totalVentasDia: 0,
          totalGananciaDia: 0,
          pedidos: []
        });
      }

      const grupo = gruposMap.get(fechaKey)!;
      grupo.pedidos.push(pedido);
      if (pedido.estado === 'confirmado') {
        grupo.totalVentasDia += (pedido.total || 0);
        grupo.totalGananciaDia += this.calcularGananciaPedido(pedido);
      }
    });

    // Ordenar los días en forma descendente (más recientes primero)
    return Array.from(gruposMap.values()).sort((a, b) => b.fechaKey.localeCompare(a.fechaKey));
  });

  ngOnInit() {
    this.cargarDatosAdmin();
  }

  cargarDatosAdmin() {
    // Cargar inventario de productos en tiempo real
    this.productoService.getProductos().subscribe(data => {
      const procesados = data.map(p => ({
        ...p,
        costo: p.costo !== undefined ? p.costo : Math.round(p.precio * 0.55)
      }));
      this.productos.set(procesados);
    });

    // Cargar pedidos en tiempo real
    this.productoService.getPedidos().subscribe(data => {
      const ordenados = data.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      this.pedidos.set(ordenados);
    });
  }

  // ==========================================
  // PARSEO Y NORMALIZACIÓN DE FECHAS
  // ==========================================
  obtenerFechaPedido(pedido: any): Date {
    if (pedido.timestamp?.toDate) {
      return pedido.timestamp.toDate();
    }
    if (pedido.timestamp?.seconds) {
      return new Date(pedido.timestamp.seconds * 1000);
    }
    if (pedido.fechaHora) {
      const partes = pedido.fechaHora.split(',');
      if (partes.length > 0) {
        const fechaPartes = partes[0].trim().split('/');
        if (fechaPartes.length === 3) {
          const dia = parseInt(fechaPartes[0], 10);
          const mes = parseInt(fechaPartes[1], 10) - 1;
          let anio = parseInt(fechaPartes[2], 10);
          if (anio < 100) anio += 2000;
          const fechaObj = new Date(anio, mes, dia);
          if (!isNaN(fechaObj.getTime())) return fechaObj;
        }
      }
      const parsed = new Date(pedido.fechaHora);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }

  // ==========================================
  // NORMALIZACIÓN DE MÉTODO DE PAGO
  // ==========================================
  obtenerMetodoPago(pedido: any): string {
    if (pedido.metodoPago) {
      const m = pedido.metodoPago.toLowerCase();
      if (m.includes('efectivo')) return 'Efectivo';
      if (m.includes('transf')) return 'Transferencia';
      return 'Mercado Pago';
    }
    return 'Mercado Pago';
  }

  getClaseMetodoPago(pedido: any): string {
    const metodo = this.obtenerMetodoPago(pedido);
    if (metodo === 'Efectivo') return 'metodo-efectivo';
    if (metodo === 'Transferencia') return 'metodo-transferencia';
    return 'metodo-mercadopago';
  }

  getIconoMetodoPago(pedido: any): string {
    const metodo = this.obtenerMetodoPago(pedido);
    if (metodo === 'Efectivo') return 'fa-money-bill-wave';
    if (metodo === 'Transferencia') return 'fa-building-columns';
    return 'fa-mobile-screen-button';
  }

  // ==========================================
  // CÁLCULOS DE COSTOS Y GANANCIAS
  // ==========================================
  calcularCostoPedido(pedido: any): number {
    if (!pedido || !pedido.items) return 0;
    return pedido.items.reduce((totalCosto: number, it: any) => {
      const prodId = it.producto?.id || it.idProducto;
      const prodNombre = it.producto?.nombre || it.nombre;
      
      const prodActual = this.productos().find(p => (prodId && p.id === prodId) || (prodNombre && p.nombre === prodNombre));
      
      const costoUnitario = prodActual?.costo ?? it.producto?.costo ?? Math.round((it.producto?.precio || it.precio || 0) * 0.55);
      return totalCosto + (costoUnitario * it.cantidad);
    }, 0);
  }

  calcularGananciaPedido(pedido: any): number {
    const venta = pedido.total || 0;
    const costo = this.calcularCostoPedido(pedido);
    return venta - costo;
  }

  calcularMargenPorcentajePedido(pedido: any): number {
    const venta = pedido.total || 0;
    if (venta <= 0) return 0;
    const ganancia = this.calcularGananciaPedido(pedido);
    return Math.round((ganancia / venta) * 100);
  }

  calcularGananciaUnitaria(prod: Producto): number {
    const venta = prod.precio || 0;
    const costo = prod.costo || 0;
    return venta - costo;
  }

  calcularMargenUnitario(prod: Producto): number {
    const venta = prod.precio || 0;
    if (venta <= 0) return 0;
    const ganancia = this.calcularGananciaUnitaria(prod);
    return Math.round((ganancia / venta) * 100);
  }

  cambiarFiltroHistorial(f: 'todos' | 'confirmado' | 'cancelado') {
    this.filtroHistorial.set(f);
  }

  cambiarFiltroMetodo(m: 'todos' | 'Mercado Pago' | 'Transferencia' | 'Efectivo') {
    this.filtroMetodoPago.set(m);
  }

  // ==========================================
  // OPERACIONES DE INVENTARIO Y PEDIDOS
  // ==========================================
  async guardarProducto(producto: Producto) {
    if (!producto.id) return;
    try {
      await this.productoService.actualizarProducto(producto.id, {
        precio: Number(producto.precio),
        costo: Number(producto.costo || 0),
        stock: Number(producto.stock)
      });
      this.toast.success(`Producto "${producto.nombre}" actualizado correctamente.`);
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      this.toast.error('Hubo un error al actualizar el producto.');
    }
  }

  async agregarNuevoProducto() {
    if (!this.nuevoNombre || this.nuevoPrecio <= 0) {
      this.toast.warning('Ingresá al menos el nombre y un precio de venta válido.');
      return;
    }
    try {
      await this.productoService.crearProducto({
        nombre: this.nuevoNombre,
        stock: Number(this.nuevoStock),
        costo: Number(this.nuevoCosto || 0),
        precio: Number(this.nuevoPrecio)
      } as any);
      
      this.toast.success(`¡"${this.nuevoNombre}" agregado con éxito al catálogo!`);

      this.nuevoNombre = '';
      this.nuevoStock = 0;
      this.nuevoCosto = 0;
      this.nuevoPrecio = 0;
    } catch (error) {
      console.error('Error al agregar el producto:', error);
      this.toast.error('Hubo un error al intentar agregar el producto.');
    }
  }

  async cambiarEstadoPedido(pedidoId: string, nuevoEstado: string) {
    try {
      if (nuevoEstado === 'confirmado') {
        await this.productoService.aprobarPedido(pedidoId);
        this.toast.success('Pedido confirmado con éxito.');
      } else if (nuevoEstado === 'cancelado') {
        await this.productoService.rechazarPedido(pedidoId);
        this.toast.info('Pedido cancelado y stock reintegrado al inventario.');
      }
    } catch (error) {
      console.error('Error al cambiar estado del pedido:', error);
      this.toast.error('No se pudo actualizar el estado del pedido.');
    }
  }

  async eliminarProducto(id: string | undefined) {
    if (!id) return;

    const confirmar = confirm('¿Estás seguro de que querés eliminar este producto de la tienda?');
    if (!confirmar) return;

    try {
      await this.productoService.eliminarProducto(id);
      this.toast.success('Producto eliminado del inventario.');
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
      this.toast.error('Hubo un error al intentar eliminar el producto.');
    }
  }

  // ==========================================
  // ELIMINACIÓN DEFINITIVA DE PEDIDOS
  // ==========================================
  abrirModalEliminarPedido(pedido: any) {
    this.pedidoAEliminar.set(pedido);
  }

  cerrarModalEliminarPedido() {
    this.pedidoAEliminar.set(null);
  }

  async confirmarEliminarPedido() {
    const pedido = this.pedidoAEliminar();
    if (!pedido || !pedido.id) return;

    this.eliminandoPedido.set(true);
    try {
      await this.productoService.eliminarPedido(pedido.id, true);
      this.toast.success(`Pedido ${pedido.numeroCompra || ''} eliminado definitivamente de la base de datos y de la cuenta del cliente.`);
      this.pedidoAEliminar.set(null);
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      this.toast.error('No se pudo eliminar el pedido.');
    } finally {
      this.eliminandoPedido.set(false);
    }
  }

  avisarStockBajoWhatsApp(prod: Producto) {
    const texto = encodeURIComponent(
      `☕ *¡Alerta de Reposición Caxambú!*\n\n📦 *Producto:* ${prod.nombre}\n⚠️ *Stock actual:* ${prod.stock} unidad(es)\n💵 *Precio costo:* $${prod.costo || 0}\n🏷️ *Precio venta:* $${prod.precio}\n\nSe requiere tostar o reponer inventario urgente.`
    );
    window.open(`https://wa.me/5492634362734?text=${texto}`, '_blank');
  }
}
