# Loginwebii

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Inicio de sesión y roles

Abre `http://localhost:4200/` para acceder al formulario. El servidor crea JWT
firmados con HS256 y los guarda en una cookie `HttpOnly` con una duración de una
hora. La sesión se comprueba en el servidor antes de permitir el acceso a las
rutas protegidas.

| Cuenta | Correo | Contraseña | Acceso |
| --- | --- | --- | --- |
| Administradora | `admin@demo.com` | `Admin123!` | `home` |
| Usuario | `usuario@demo.com` | `Usuario123!` | `sin-acceso` |

La ruta `home` requiere sesión válida y rol `admin`. Si alguien sin sesión
intenta abrirla, se le devuelve al login; con una sesión válida pero sin el rol
requerido, se muestra `sin-acceso`. Al iniciar sesión correctamente, `home`
saluda a la persona y presenta sus datos registrados.

Las cuentas y contraseñas están predefinidas solo para esta demostración. Antes
de desplegar en producción, reemplázalas por usuarios persistidos y contraseñas
con hash; además configura `JWT_SECRET` con un secreto aleatorio y privado. Si
no se configura, el servidor genera un secreto nuevo al arrancar y las sesiones
anteriores dejan de ser válidas.

En producción, sirve el sitio mediante HTTPS para que la cookie también use el
atributo `Secure`.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
