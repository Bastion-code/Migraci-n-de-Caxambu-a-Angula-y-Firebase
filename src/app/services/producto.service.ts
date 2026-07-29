import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  query, // Agregado para filtrar reseñas
  where  // Agregado para filtrar reseñas
} from 'firebase/firestore';
import { collectionData } from 'rxfire/firestore';
import { Observable } from 'rxjs';
import { FIRESTORE } from '../app.config';
import { Producto, Resena } from '../models/producto.model'; // Asegurate de importar Resena

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private firestore: Firestore = inject(FIRESTORE);
  private coleccion = collection(this.firestore, 'productos');

  // Leer todos los productos en tiempo real
  getProductos(): Observable<Producto[]> {
    return collectionData(this.coleccion, { idField: 'id' }) as Observable<Producto[]>;
  }

  // Leer todos los pedidos en tiempo real para el panel de administración
  getPedidos(): Observable<any[]> {
    const pedidosColeccion = collection(this.firestore, 'pedidos');
    return collectionData(pedidosColeccion, { idField: 'id' }) as Observable<any[]>;
  }

  // Crear producto
  crearProducto(producto: Producto) {
    return addDoc(this.coleccion, producto);
  }

  // Actualizar producto
  actualizarProducto(id: string, producto: Partial<Producto>) {
    const docRef = doc(this.firestore, 'productos', id);
    return updateDoc(docRef, producto);
  }

  // Eliminar producto
  eliminarProducto(id: string) {
    const docRef = doc(this.firestore, 'productos', id);
    return deleteDoc(docRef);
  }

  // Crear pedido básico
  crearPedido(pedido: { items: any[]; clienteEmail: string; total: number; numeroCompra: string; fechaHora: string; estado: string }) {
    const pedidosColeccion = collection(this.firestore, 'pedidos');
    return addDoc(pedidosColeccion, {
      ...pedido,
      timestamp: new Date()
    });
  }

  // ==========================================
  // SISTEMA DE RESEÑAS
  // ==========================================

  // Obtener reseñas de un producto específico
  getResenasPorProducto(productoId: string): Observable<Resena[]> {
    const resenasColeccion = collection(this.firestore, 'resenas');
    const q = query(resenasColeccion, where('productoId', '==', productoId));
    return collectionData(q, { idField: 'id' }) as Observable<Resena[]>;
  }

  // Crear una nueva reseña
  crearResena(resena: Omit<Resena, 'id' | 'fechaHora' | 'timestamp'>) {
    const resenasColeccion = collection(this.firestore, 'resenas');
    
    const fechaActual = new Date().toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

    return addDoc(resenasColeccion, {
      ...resena,
      fechaHora: fechaActual,
      timestamp: new Date()
    });
  }

  // ==========================================
  // UTILIDADES Y TRANSACCIONES
  // ==========================================

  // Mapeo de imágenes locales
  obtenerImagenProducto(nombre: string): string {
    if (!nombre) return 'assets/img/250g-colombiano-brasil.png';
    
    const n = nombre.toLowerCase().trim();

    if (n.includes('colombiano') && n.includes('brasil')) {
      return 'assets/img/250g-colombiano-brasil.png';
    } else if (n.includes('blend')) {
      return 'assets/img/Cafe-Blend.png';
    } else if (n.includes('moka')) {
      return 'assets/img/Cafe-moka-Brasil.png';
    } else if (n.includes('australiano')) {
      return 'assets/img/cafe-australiano.jpg';
    } else if (n.includes('ingles')) {
      return 'assets/img/cafe-ingles.jpg';
    } else if (n.includes('irish')) {
      return 'assets/img/cafe-irish.jpg';
    } else if (n.includes('liqueurs') || n.includes('licor')) {
      return 'assets/img/cafe-liqueurs.jpg';
    } else if (n.includes('helado')) {
      return 'assets/img/cafe-helado.jpg';
    } else if (n.includes('viena')) {
      return 'assets/img/cafe-viena.jpg';
    } else {
      return 'assets/img/250g-colombiano-brasil.png';
    }
  }

  // Finalizar Compra: Lecturas primero, escrituras después de forma segura cumpliendo restricciones de transacciones
  async finalizarCompra(clienteEmail: string, carrito: ItemCarrito[]) {
    const pedidosColeccion = collection(this.firestore, 'pedidos');
    const numeroCompra = 'CAX-' + Math.floor(1000 + Math.random() * 9000);
    const fechaActual = new Date().toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

    return await runTransaction(this.firestore, async (transaction) => {
      // FASE 1: Todas las lecturas (get) primero obligatoriamente
      const productChecks = [];
      for (const item of carrito) {
        if (!item.producto.id) throw new Error('Producto sin ID válido');
        const productoRef = doc(this.firestore, `productos/${item.producto.id}`);
        const productoDoc = await transaction.get(productoRef);
        productChecks.push({ item, productoRef, productoDoc });
      }

      // Validar stock tras lectura segura
      for (const check of productChecks) {
        if (!check.productoDoc.exists()) {
          throw new Error(`El producto ${check.item.producto.nombre} ya no existe.`);
        }

        const data = check.productoDoc.data();
        const stockActual = data ? (data['stock'] || 0) : 0;
        
        if (stockActual < check.item.cantidad) {
          throw new Error(`Stock insuficiente para ${check.item.producto.nombre}. Disponible: ${stockActual}`);
        }
      }

      // FASE 2: Todas las escrituras después
      for (const check of productChecks) {
        const data = check.productoDoc.data();
        const stockActual = data ? (data['stock'] || 0) : 0;
        transaction.update(check.productoRef, { stock: stockActual - check.item.cantidad });
      }

      const total = carrito.reduce((acc, i) => acc + (i.producto.precio * i.cantidad), 0);
      const itemsFormateados = carrito.map(i => ({
        producto: i.producto,
        cantidad: i.cantidad
      }));

      const nuevoPedidoRef = doc(pedidosColeccion);
      transaction.set(nuevoPedidoRef, {
        clienteEmail,
        items: itemsFormateados,
        total,
        numeroCompra,
        fechaHora: fechaActual,
        estado: 'pendiente',
        timestamp: new Date()
      });
    });
  }

  // Aprobar Pedido
  async aprobarPedido(idPedido: string) {
    const pedidoRef = doc(this.firestore, 'pedidos', idPedido);
    return updateDoc(pedidoRef, { estado: 'confirmado' });
  }

  // Rechazar / Cancelar Pedido (Devuelve el stock al inventario de forma segura)
  async rechazarPedido(idPedido: string) {
    return await runTransaction(this.firestore, async (transaction) => {
      const pedidoRef = doc(this.firestore, 'pedidos', idPedido);
      const pedidoDoc = await transaction.get(pedidoRef);

      if (!pedidoDoc.exists()) throw new Error('El pedido no existe.');
      const pedidoData = pedidoDoc.data();

      if (!pedidoData || pedidoData['estado'] === 'cancelado') return;

      // FASE 1: Lecturas
      const updates = [];
      for (const item of pedidoData['items']) {
        const idProd = item.producto?.id || item.idProducto;
        const cantidad = item.cantidad || 0;

        if (idProd) {
          const productoRef = doc(this.firestore, `productos/${idProd}`);
          const productoDoc = await transaction.get(productoRef);
          updates.push({ productoRef, productoDoc, cantidad });
        }
      }

      // FASE 2: Escrituras
      for (const update of updates) {
        if (update.productoDoc.exists()) {
          const prodData = update.productoDoc.data();
          const stockActual = prodData ? (prodData['stock'] || 0) : 0;
          transaction.update(update.productoRef, { stock: stockActual + update.cantidad });
        }
      }

      transaction.update(pedidoRef, { estado: 'cancelado' });
    });
  }
}