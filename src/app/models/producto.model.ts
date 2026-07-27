export interface Producto {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagenUrl: string;
  stock: number;
  descuento?: number; // Descuento opcional
}