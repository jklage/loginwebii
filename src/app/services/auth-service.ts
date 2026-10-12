import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, shareReplay, tap, catchError, throwError } from 'rxjs';

export type UserRole = 'admin' | 'usuario';

export interface AuthUser {
  id: number;
  nombre: string;
  correo: string;
  rol: UserRole;
}

interface ApiError {
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private sessionRequest?: Observable<AuthUser | null>;
  private currentUser: AuthUser | null = null;

  login(correo: string, contrasena: string): Observable<AuthUser> {
    return this.http
      .post<AuthUser>('/api/login', { correo, contrasena })
      .pipe(
        tap((usuario) => {
          this.currentUser = usuario;
          this.sessionRequest = of(usuario);
        }),
      );
  }

  getSession(): Observable<AuthUser | null> {
    if (!this.sessionRequest) {
      this.sessionRequest = this.http.get<AuthUser>('/api/session').pipe(
        tap((usuario) => {
          this.currentUser = usuario;
        }),
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.currentUser = null;
            return of(null);
          }

          this.sessionRequest = undefined;
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.sessionRequest;
  }

  usuarioActual(): AuthUser | null {
    return this.currentUser;
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/logout', {}).pipe(
      tap(() => {
        this.currentUser = null;
        this.sessionRequest = of(null);
      }),
    );
  }

  mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as ApiError | null;
      return body?.message ?? 'No fue posible conectar con el servicio de acceso.';
    }

    return 'Ocurrió un error inesperado. Intenta de nuevo.';
  }
}
