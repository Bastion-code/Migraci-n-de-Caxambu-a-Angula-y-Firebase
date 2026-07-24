import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Tienda } from './pages/tienda/tienda';
import { Admin } from './pages/admin/admin';
import { Perfil } from './pages/perfil/perfil';
import { Soporte } from './pages/soporte/soporte';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'tienda', component: Tienda },
  { path: 'soporte', component: Soporte },
  { path: 'admin', component: Admin, canActivate: [authGuard] },
  { path: 'perfil', component: Perfil, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];