import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { collectionData } from 'rxfire/firestore';
import { Observable } from 'rxjs';
import { FIRESTORE } from '../app.config';
import { Producto } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private firestore: Firestore = inject(FIRESTORE);
  private coleccion = collection(this.firestore, 'productos');

  // Leer todos los productos en tiempo real
  getProductos(): Observable<Producto[]> {
    return collectionData(this.coleccion, { idField: 'id' }) as Observable<Producto[]>;
  }

  // Crear
  crearProducto(producto: Producto) {
    return addDoc(this.coleccion, producto);
  }

  // Actualizar
  actualizarProducto(id: string, producto: Partial<Producto>) {
    const docRef = doc(this.firestore, 'productos', id);
    return updateDoc(docRef, producto);
  }

  // Eliminar
  eliminarProducto(id: string) {
    const docRef = doc(this.firestore, 'productos', id);
    return deleteDoc(docRef);
  }

  // Registrar un pedido de compra en estado pendiente para que el vendedor lo confirme
  crearPedido(pedido: { items: any[]; clienteEmail: string; total: number }) {
    const pedidosColeccion = collection(this.firestore, 'pedidos');
    
    // Generar un número de compra único y la fecha/hora actual
    const numeroCompra = 'CAX-' + Math.floor(1000 + Math.random() * 9000);
    const fechaActual = new Date().toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

    return addDoc(pedidosColeccion, {
      ...pedido,
      numeroCompra: numeroCompra,
      fechaHora: fechaActual,
      estado: 'pendiente',
      timestamp: new Date()
    });
  }
}