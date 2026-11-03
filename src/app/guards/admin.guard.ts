import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map((user) => {
      if (user && authService.isAdmin(user)) {
        return true;
      }
      
      // Si no es Mariano / administrador, redirigir
      if (!user) {
        router.navigate(['/login']);
      } else {
        router.navigate(['/tienda']);
      }
      return false;
    })
  );
};
