import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  imports: [FormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  correo = '';
  contrasena = '';
  error = '';
  cargando = false;

  iniciarSesion(): void {
    if (this.cargando) {
      return;
    }

    this.error = '';
    this.cargando = true;

    this.authService.login(this.correo, this.contrasena).subscribe({
      next: (usuario) => {
        this.cargando = false;
        void this.router.navigate([
          usuario.rol === 'admin' ? '/home' : '/sin-acceso',
        ]);
      },
      error: (error: unknown) => {
        this.cargando = false;
        this.error = this.authService.mensajeError(error);
      },
    });
  }
}
