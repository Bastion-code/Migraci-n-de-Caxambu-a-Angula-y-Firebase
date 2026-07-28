import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth, signInWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../app.config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private auth: Auth = inject(FIREBASE_AUTH);
  private router = inject(Router);

  email: string = '';
  pass: string = '';
  errorMessage: string = '';

  onSubmit() {
    this.iniciarSesion();
  }

  async iniciarSesion() {
    try {
      const credencial = await signInWithEmailAndPassword(this.auth, this.email, this.pass);
      
      if (credencial.user.email === 'mariano@caxambu.com') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/tienda']);
      }
    } catch (error: any) {
      console.error('Código de error de Firebase:', error.code);
      console.error('Mensaje completo:', error.message);
      this.errorMessage = 'Correo o contraseña incorrectos. Por favor, verificá tus datos.';
    }
  }
}