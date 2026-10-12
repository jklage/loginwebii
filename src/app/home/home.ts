import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth-service';

@Component({
  imports: [RouterLink],
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
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
