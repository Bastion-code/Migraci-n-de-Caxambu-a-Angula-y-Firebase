import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <-- NECESARIO PARA EL INPUT
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  authService = inject(AuthService);

  nombreActual: string = '';
  editando: boolean = false;
  mensaje: string = '';

  ngOnInit() {
    // Leemos el nombre actual de la base de datos al cargar la página
    this.authService.currentUser$.subscribe(user => {
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
      
      // Recargamos sutilmente para que el header actualice el nombre
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error(error);
      this.mensaje = 'Hubo un error al guardar.';
    }
  }
}