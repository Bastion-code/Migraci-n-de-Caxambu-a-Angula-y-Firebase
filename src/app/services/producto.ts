import { Injectable, inject } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
import { FIRESTORE } from '../app.config';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private firestore = inject(FIRESTORE);

  getProductos(): Observable<any[]> {
    const productosCollection = collection(this.firestore as any, 'productos');
    const promesa = getDocs(productosCollection).then(querySnapshot => {
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data,
          imagen_url: (data as any).imagen_url && (data as any).imagen_url !== "" 
            ? (data as any).imagen_url 
            : '/assets/img/Logo.png' // Imagen por defecto para que no falle
        });
      });
      console.log("PRODUCTOS OBTENIDOS:", items);
      return items;
    });
    return from(promesa);
  }
}