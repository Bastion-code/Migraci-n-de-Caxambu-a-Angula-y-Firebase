import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile, // <-- AGREGAR ESTO
  User
} from 'firebase/auth';
import { Observable } from 'rxjs';
import { FIREBASE_AUTH } from '../app.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth: Auth = inject(FIREBASE_AUTH);

  currentUser$ = new Observable<User | null>((subscriber) => {
    return onAuthStateChanged(this.auth, (user) => subscriber.next(user));
  });

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }

  get isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }

  // --- NUEVA FUNCIÓN PARA CAMBIAR EL NOMBRE ---
  actualizarNombre(nombre: string) {
    if (this.auth.currentUser) {
      return updateProfile(this.auth.currentUser, { displayName: nombre });
    }
    return Promise.reject('No hay usuario activo');
  }
}