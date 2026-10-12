import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth-service';

@Component({
  imports: [RouterLink],
  selector: 'app-sin-acceso',
  templateUrl: './sin-acceso.html',
  styleUrl: './sin-acceso.css',
})
export class SinAcceso {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuario = this.authService.usuarioActual();

  cerrarSesion(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: (error: unknown) => {
        console.error('No fue posible cerrar la sesión.', error);
      },
    });
  }
}
