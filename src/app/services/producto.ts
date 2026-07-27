import { Injectable, inject } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
import { FIRESTORE } from '../app.config';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private firestore = inject(FIRESTORE);

  getProductos(): Observable<any[]> {
    const productosCollection = collection(this.firestore as any, 'productos');
    const promesa = getDocs(productosCollection).then(querySnapshot => {
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
    return from(promesa);
  }
}