import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Tienda } from './pages/tienda/tienda';
import { Soporte } from './pages/soporte/soporte';
import { LoginComponent } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Perfil } from './pages/perfil/perfil';
import { authGuard } from './guards/auth.guard';
import { AdminComponent } from './pages/admin/admin';
import { Recetas } from './pages/recetas/recetas';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'tienda', component: Tienda },
  { path: 'soporte', component: Soporte },
  { path: 'login', component: LoginComponent },

  { path: 'registro', component: Registro },
  { path: 'perfil', component: Perfil, canActivate: [authGuard] },
  { path: 'vendedor', component: AdminComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'recetas', component: Recetas },
  { path: '**', redirectTo: 'tienda' }
];