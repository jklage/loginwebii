import 'dotenv/config';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const sessionDurationSeconds = 60 * 60;
const sessionCookieName = 'loginwebii_session';
const jwtSecret = process.env['JWT_SECRET'] ?? randomBytes(32).toString('hex');

type UserRole = 'admin' | 'usuario';

// Fila de la tabla usuarios
interface UsuarioFila extends RowDataPacket {
  id: number;
  nombre: string;
  correo: string;
  contrasena: string; // hash de bcrypt
  rol: UserRole;
}

// Conexión a MySQL (los datos vienen del archivo .env)
const db = mysql.createPool({
  host: process.env['DB_HOST'] ?? 'localhost',
  port: Number(process.env['DB_PORT'] ?? 3306),
  user: process.env['DB_USER'] ?? 'root',
  password: process.env['DB_PASSWORD'] ?? '',
  database: process.env['DB_NAME'] ?? 'loginwebii',
  waitForConnections: true,
  connectionLimit: 10,
});

// Usuarios de prueba: se insertan una sola vez gracias al UNIQUE del correo
const usuariosDemo: { nombre: string; correo: string; contrasena: string; rol: UserRole }[] = [
  { nombre: 'Ana Administradora', correo: 'admin@demo.com', contrasena: 'Admin123!', rol: 'admin' },
  { nombre: 'Luis Usuario', correo: 'usuario@demo.com', contrasena: 'Usuario123!', rol: 'usuario' },
];

async function crearUsuariosDemo(): Promise<void> {
  for (const usuario of usuariosDemo) {
    const hash = await bcrypt.hash(usuario.contrasena, 10);
    await db.query(
      'INSERT IGNORE INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, ?)',
      [usuario.nombre, usuario.correo, hash, usuario.rol],
    );
  }
}

async function buscarPorCorreo(correo: string): Promise<UsuarioFila | null> {
  const [filas] = await db.query<UsuarioFila[]>(
    'SELECT * FROM usuarios WHERE correo = ? LIMIT 1',
    [correo],
  );
  return filas[0] ?? null;
}

async function buscarPorId(id: number): Promise<UsuarioFila | null> {
  const [filas] = await db.query<UsuarioFila[]>(
    'SELECT * FROM usuarios WHERE id = ? LIMIT 1',
    [id],
  );
  return filas[0] ?? null;
}

async function verificarContrasena(
  user: UsuarioFila,
  contrasena: string,
): Promise<boolean> {
  if (/^\$2[aby]\$\d{2}\$/.test(user.contrasena)) {
    return bcrypt.compare(contrasena, user.contrasena);
  }

  if (user.contrasena !== contrasena) {
    return false;
  }

  const hash = await bcrypt.hash(contrasena, 10);
  const [resultado] = await db.execute<ResultSetHeader>(
    'UPDATE usuarios SET contrasena = ? WHERE id = ? AND contrasena = ?',
    [hash, user.id, user.contrasena],
  );

  if (resultado.affectedRows === 1) {
    return true;
  }

  const usuarioActualizado = await buscarPorId(user.id);
  return usuarioActualizado
    ? bcrypt.compare(contrasena, usuarioActualizado.contrasena)
    : false;
}

// Lo que se manda al navegador (nunca la contraseña)
function publicUser(user: UsuarioFila) {
  return {
    id: user.id,
    nombre: user.nombre,
    correo: user.correo,
    rol: user.rol,
  };
}

function signSession(user: UsuarioFila): string {
  return jwt.sign({ id: user.id, rol: user.rol }, jwtSecret, {
    algorithm: 'HS256',
    expiresIn: sessionDurationSeconds,
  });
}

// Lee la cookie, verifica el JWT y regresa el id del usuario
function sessionUserId(req: express.Request): number | null {
  const sessionCookie = req.headers.cookie
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${sessionCookieName}=`));

  if (!sessionCookie) {
    return null;
  }

  try {
    const payload = jwt.verify(
      sessionCookie.slice(sessionCookieName.length + 1),
      jwtSecret,
      { algorithms: ['HS256'] },
    );
    return typeof payload === 'object' && typeof payload['id'] === 'number'
      ? payload['id']
      : null;
  } catch {
    return null; // firma inválida o token expirado
  }
}

function setSessionCookie(res: express.Response, token: string): void {
  const secure = process.env['NODE_ENV'] === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${sessionDurationSeconds}${secure}`,
  );
}

const app = express();
const angularApp = new AngularNodeAppEngine();
app.use(express.json());

crearUsuariosDemo().catch((error: unknown) => {
  console.error('No fue posible crear los usuarios de prueba.', error);
});

app.post('/api/login', async (req, res) => {
  const { correo, contrasena } = req.body as {
    correo?: unknown;
    contrasena?: unknown;
  };

  if (typeof correo !== 'string' || typeof contrasena !== 'string') {
    res
      .status(400)
      .json({ message: 'Ingresa un correo y una contraseña válidos.' });
    return;
  }

  try {
    const user = await buscarPorCorreo(correo.trim().toLowerCase());
    const passwordValido =
      user !== null && (await verificarContrasena(user, contrasena));

    if (!user || !passwordValido) {
      res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
      return;
    }

    setSessionCookie(res, signSession(user));
    res.status(200).json(publicUser(user));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'No fue posible conectar con la base de datos.' });
  }
});

app.get('/api/session', async (req, res) => {
  const id = sessionUserId(req);

  try {
    const user = id === null ? null : await buscarPorId(id);
    if (!user) {
      res.status(401).json({ message: 'La sesión no es válida o ha expirado.' });
      return;
    }

    res.status(200).json(publicUser(user));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'No fue posible conectar con la base de datos.' });
  }
});

app.post('/api/logout', (_req, res) => {
  res.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
  );
  res.status(204).end();
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
