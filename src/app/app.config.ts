import { ApplicationConfig, provideBrowserGlobalErrorListeners, InjectionToken } from '@angular/core';
import { provideRouter } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

const firebaseApp = initializeApp(environment.firebaseConfig);

export const FIREBASE_AUTH = new InjectionToken<Auth>('firebase.auth', {
  factory: () => getAuth(firebaseApp)
});

export const FIRESTORE = new InjectionToken<Firestore>('firestore', {
  factory: () => getFirestore(firebaseApp)
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Registramos los servicios de Firebase para que estén disponibles en la app
    { provide: FIREBASE_AUTH, useFactory: () => getAuth(firebaseApp) },
    { provide: FIRESTORE, useFactory: () => getFirestore(firebaseApp) }
  ]
};