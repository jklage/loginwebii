app.use(cors());
app.use(express.json());

app.post('/api/registro', async (req, res) => {
  const { nombre, correo, contraseña, rol } = req.body;
  const passwordHash = await bcrypt.hash(contraseña, 10);
  const sql = 'INSERT INTO usuarios (nombre, correo, contraseña, rol) VALUES (?, ?, ?, ?)';

  conexion.query(sql, [nombre, correo, passwordHash, rol], (error, results) => {
    if (error) {
      console.error('Error al registrar usuario:', error);
      return res.status(500).json({ message: 'Error al registrar usuario' });
    }

    return res.status(201).json({ message: 'Usuario registrado correctamente' });
  });
});

app.post('/api/login', (req, res) => {
  const { correo, contrasena } = req.body;
  const sql = 'SELECT * FROM usuarios WHERE correo = ?';

  conexion.query(sql, [correo], async (error, results) => {
    if (error) {
      return res.status(500).json({ mensaje: 'Error al iniciar sesión' });
    }

    if (results.length === 0) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    const user = results[0];
    const passwordValido = await bcrypt.compare(contrasena, user.contraseña);

    if (!passwordValido) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ mensaje: 'Inicio de sesión exitoso', token });
  });
});

