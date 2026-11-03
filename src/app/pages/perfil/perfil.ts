import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  authService = inject(AuthService);
  private toast = inject(ToastService);

  currentUser: User | null = null;
  nombreActual: string = '';
  editando: boolean = false;
  mensaje: string = '';

  get isAdmin(): boolean {
    return this.authService.isAdmin(this.currentUser);
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.nombreActual = user.displayName || '';
      }
    });
  }

  activarEdicion() {
    this.editando = true;
    this.mensaje = '';
  }

  async guardarDatos() {
    try {
      await this.authService.actualizarNombre(this.nombreActual);
      this.editando = false;
      this.mensaje = '¡Nombre actualizado con éxito!';
      this.toast.success('Tu nombre ha sido actualizado.');
      
      setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      console.error(error);
      this.mensaje = 'Hubo un error al guardar.';
      this.toast.error('No se pudo guardar el nombre.');
    }
  }
}
