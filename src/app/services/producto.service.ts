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
}