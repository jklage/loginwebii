import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService, UserRole } from '../services/auth-service';

export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data['roles'] as readonly UserRole[];

  return authService.getSession().pipe(
    map((usuario) => {
      if (!usuario) {
        return router.createUrlTree(['/login']);
      }

      return allowedRoles.includes(usuario.rol)
        ? true
        : router.createUrlTree(['/sin-acceso']);
    }),
  );
};
