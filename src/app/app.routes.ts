import { Routes } from '@angular/router';

// Las importaciones solo llevan el nombre del componente y su ubicación
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Tienda } from './pages/tienda/tienda';
import { Admin } from './pages/admin/admin';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'tienda', component: Tienda },
  { path: 'admin', component: Admin },
  { path: '**', redirectTo: '' } // Redirige al inicio si la URL no existe
];