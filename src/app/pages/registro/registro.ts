import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';

  mostrarPassword = false;

  toggleMostrarPassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  async onSubmit() {
    this.errorMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      this.toast.warning('Las contraseñas no coinciden.');
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      this.toast.warning('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      await this.authService.register(this.email, this.password);
      this.toast.success('¡Tu cuenta fue creada con éxito! Bienvenido a Caxambú.');
      this.router.navigate(['/tienda']);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        this.errorMessage = 'Ese correo ya está registrado.';
        this.toast.error('Ese correo ya está registrado. Probá iniciando sesión.');
      } else {
        this.errorMessage = 'No se pudo completar el registro.';
        this.toast.error('No se pudo completar el registro.');
      }
      console.error(error);
    }
  }
}
