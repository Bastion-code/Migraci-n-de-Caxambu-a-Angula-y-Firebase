export interface Producto {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagenUrl: string;
  stock: number;
  descuento?: number; 
}

// Nueva interfaz para las reseñas
export interface Resena {
  id?: string;
  productoId: string;
  usuarioEmail: string;
  comentario: string;
  calificacion: number; // Por ejemplo, de 1 a 5
  fechaHora: string;
  timestamp?: any;
}
