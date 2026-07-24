import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  errorMessage = '';

  async onSubmit() {
    this.errorMessage = '';
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/']);
    } catch (error) {
      this.errorMessage = 'Correo o contraseña incorrectos.';
      console.error(error);
    }
  }
}