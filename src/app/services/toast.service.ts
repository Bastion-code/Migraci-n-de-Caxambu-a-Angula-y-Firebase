import { Injectable, signal } from '@angular/core';

export interface ToastNotification {
  id: number;
  tipo: 'success' | 'error' | 'warning' | 'info';
  titulo: string;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<ToastNotification[]>([]);
  private nextId = 1;

  show(tipo: 'success' | 'error' | 'warning' | 'info', titulo: string, mensaje: string, duracion = 4000) {
    const id = this.nextId++;
    const nuevoToast: ToastNotification = { id, tipo, titulo, mensaje };
    this.toasts.update(actuales => [...actuales, nuevoToast]);

    setTimeout(() => {
      this.remove(id);
    }, duracion);
  }

  success(mensaje: string, titulo = '¡Éxito!') {
    this.show('success', titulo, mensaje);
  }

  error(mensaje: string, titulo = 'Atención') {
    this.show('error', titulo, mensaje);
  }

  warning(mensaje: string, titulo = 'Advertencia') {
    this.show('warning', titulo, mensaje);
  }

  info(mensaje: string, titulo = 'Información') {
    this.show('info', titulo, mensaje);
  }

  remove(id: number) {
    this.toasts.update(actuales => actuales.filter(t => t.id !== id));
  }
}
