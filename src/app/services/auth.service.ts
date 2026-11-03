import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { Observable } from 'rxjs';
import { FIREBASE_AUTH } from '../app.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth: Auth = inject(FIREBASE_AUTH);

  // Lista de correos autorizados para el rol de administrador
  readonly adminEmails: string[] = ['mariano@caxambu.com'];

  currentUser$ = new Observable<User | null>((subscriber) => {
    return onAuthStateChanged(this.auth, (user) => subscriber.next(user));
  });

  isAdmin(user: User | null): boolean {
    if (!user || !user.email) return false;
    return this.adminEmails.includes(user.email.toLowerCase().trim());
  }

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

  // CAMBIAR EL NOMBRE
  actualizarNombre(nombre: string) {
    if (this.auth.currentUser) {
      return updateProfile(this.auth.currentUser, { displayName: nombre });
    }
    return Promise.reject('No hay usuario activo');
  }
}
