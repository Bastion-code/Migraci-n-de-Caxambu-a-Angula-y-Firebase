import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { Observable } from 'rxjs';
import { FIREBASE_AUTH } from '../app.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth: Auth = inject(FIREBASE_AUTH);

  // Observable que emite el usuario actual (o null si no hay sesión)
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
}