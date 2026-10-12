import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/components/login';
import { SinAcceso } from './sin-acceso/sin-acceso';
import { authGuard } from './guards/auth.guard';
import { permissionGuard } from './guards/permission.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: Login },
  {
    path: 'home',
    component: Home,
    canActivate: [authGuard, permissionGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'sin-acceso',
    component: SinAcceso,
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'login' },
];
