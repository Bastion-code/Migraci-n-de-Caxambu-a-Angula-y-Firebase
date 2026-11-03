export interface Producto {
  id?: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number; // Precio de costo para cálculo de margen comercial
  categoria?: string;
  imagenUrl?: string;
  stock: number;
  descuento?: number; 
}

// Nueva interfaz para las reseñas
export interface Resena {
  id?: string;
  productoId: string;
  usuarioEmail: string;
  comentario: string;
  calificacion: number;
  fechaHora: string;
  timestamp?: any;
}
