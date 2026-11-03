import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../app.config';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private auth: Auth = inject(FIREBASE_AUTH);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  email: string = '';
  pass: string = '';
  errorMessage: string = '';

  // Control para mostrar u ocultar la contraseña
  mostrarPassword: boolean = false;

  // Control para el modal de recuperación de contraseña
  mostrarModalRecuperar: boolean = false;
  emailRecuperar: string = '';
  enviandoRecuperacion: boolean = false;

  toggleMostrarPassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  onSubmit() {
    this.iniciarSesion();
  }

  async iniciarSesion() {
    try {
      const credencial = await signInWithEmailAndPassword(this.auth, this.email, this.pass);
      
      this.toast.success('¡Bienvenido a Café Caxambú!', 'Sesión iniciada');

      if (this.authService.isAdmin(credencial.user)) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/tienda']);
      }
    } catch (error: any) {
      console.error('Código de error de Firebase:', error.code);
      console.error('Mensaje completo:', error.message);
      this.errorMessage = 'Correo o contraseña incorrectos. Por favor, verificá tus datos.';
      this.toast.error('Correo o contraseña incorrectos.');
    }
  }

  abrirRecuperar(event: Event) {
    event.preventDefault();
    this.emailRecuperar = this.email || '';
    this.mostrarModalRecuperar = true;
  }

  cerrarRecuperar() {
    this.mostrarModalRecuperar = false;
  }

  async enviarRecuperacion() {
    const correo = this.emailRecuperar.trim();
    if (!correo || !correo.includes('@')) {
      this.toast.warning('Ingresá un correo electrónico válido para enviar el enlace.');
      return;
    }

    try {
      this.enviandoRecuperacion = true;
      await sendPasswordResetEmail(this.auth, correo);
      this.enviandoRecuperacion = false;
      this.mostrarModalRecuperar = false;
      this.toast.success(
        `Te enviamos un enlace a ${correo} para restablecer tu clave. Revisá tu bandeja de entrada o spam.`,
        '¡Correo Enviado!'
      );
    } catch (error: any) {
      this.enviandoRecuperacion = false;
      console.error('Error al enviar correo de recuperación:', error);
      if (error.code === 'auth/user-not-found') {
        this.toast.error('No se encontró ninguna cuenta registrada con este correo.');
      } else {
        this.toast.error('Ocurrió un error al intentar enviar el correo. Probá nuevamente.');
      }
    }
  }
}
