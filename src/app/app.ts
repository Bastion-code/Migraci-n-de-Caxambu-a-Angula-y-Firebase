import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { FIREBASE_AUTH } from './app.config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {
  title = 'CaxambuAngular';
  
  private auth: Auth = inject(FIREBASE_AUTH);
  private router = inject(Router);

  // Señal reactiva para el usuario actual
  currentUser = signal<User | null>(null);
  
  // Controla si el menú desplegable está abierto o cerrado
  dropdownOpen = signal(false);

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
    });
  }

  // Función para abrir/cerrar el menú
  toggleDropdown() {
    this.dropdownOpen.update(valor => !valor);
  }

  // Función para cerrar sesión
  async cerrarSesion() {
    try {
      await this.auth.signOut();
      this.dropdownOpen.set(false);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}